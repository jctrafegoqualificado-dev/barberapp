import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req, ["OWNER"]);
    const barbershopId = payload.barbershopId!;
    const now = new Date();

    const shop = await prisma.barbershop.findUnique({ where: { id: barbershopId } });
    const poeOwnerPct = shop?.poeOwnerPct ?? 50;
    const poeBarberPct = 100 - poeOwnerPct;

    // Assinaturas ativas
    const subscriptions = await prisma.subscription.findMany({
      where: { barbershopId, status: "ACTIVE" },
      include: {
        plan: true,
        appointments: {
          where: {
            status: "DONE",
            subscriptionId: { not: null }, // apenas serviços de assinatura
            date: { gte: startOfMonth(now), lte: endOfMonth(now) },
          },
          include: {
            barber: {
              include: { user: { select: { name: true } } },
            },
            service: true,
          },
        },
      },
    });

    // POE = soma de todos os planos ativos (MRR)
    const poeTotal = subscriptions.reduce((s, sub) => s + sub.plan.price, 0);

    // Fatias do POE
    const poeBarbearia = poeTotal * (poeOwnerPct / 100);
    const poolBarbeiros = poeTotal * (poeBarberPct / 100);

    // Total de serviços realizados via assinatura no mês
    const allAppointments = subscriptions.flatMap((sub) => sub.appointments);
    const totalServicos = allAppointments.length;

    // Ticket médio por serviço (pool ÷ total serviços)
    const ticketPorServico = totalServicos > 0 ? poolBarbeiros / totalServicos : 0;

    // Partilha por barbeiro
    const barberMap: Record<string, { name: string; servicos: number; recebe: number }> = {};
    for (const appt of allAppointments) {
      const id = appt.barber.id;
      const name = appt.barber.user.name;
      if (!barberMap[id]) barberMap[id] = { name, servicos: 0, recebe: 0 };
      barberMap[id].servicos += 1;
      barberMap[id].recebe += ticketPorServico;
    }

    // Planos
    const planMap: Record<string, { name: string; price: number; assinantes: number; receita: number }> = {};
    for (const sub of subscriptions) {
      const pid = sub.plan.id;
      if (!planMap[pid]) planMap[pid] = { name: sub.plan.name, price: sub.plan.price, assinantes: 0, receita: 0 };
      planMap[pid].assinantes += 1;
      planMap[pid].receita += sub.plan.price;
    }

    // Utilização dos planos
    const totalUsos = subscriptions.reduce((s, sub) => s + sub.usesThisCycle, 0);
    const totalDisponivel = subscriptions.reduce((s, sub) => s + (sub.plan.maxUses || 0), 0);

    // Inadimplentes e novas assinaturas
    const [inadimplentes, novasMes] = await Promise.all([
      prisma.subscription.count({ where: { barbershopId, status: "OVERDUE" } }),
      prisma.subscription.count({
        where: { barbershopId, createdAt: { gte: startOfMonth(now), lte: endOfMonth(now) } },
      }),
    ]);

    return NextResponse.json({
      poeOwnerPct,
      poeBarberPct,
      poeTotal,
      poeBarbearia,
      poolBarbeiros,
      ticketPorServico,
      totalServicos,
      totalAssinantes: subscriptions.length,
      taxaUtilizacao: totalDisponivel > 0 ? Math.round((totalUsos / totalDisponivel) * 100) : 0,
      inadimplentes,
      novasMes,
      partilhaBarbeiros: Object.entries(barberMap)
        .map(([id, b]) => ({ id, ...b }))
        .sort((a, b) => b.servicos - a.servicos),
      planos: Object.entries(planMap).map(([id, p]) => ({ id, ...p })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 500 });
  }
}

// Atualiza o percentual do POE da barbearia
export async function PATCH(req: NextRequest) {
  try {
    const payload = requireAuth(req, ["OWNER"]);
    const { poeOwnerPct } = await req.json();
    if (poeOwnerPct < 0 || poeOwnerPct > 100) {
      return NextResponse.json({ error: "Percentual inválido" }, { status: 400 });
    }
    await prisma.barbershop.update({
      where: { id: payload.barbershopId! },
      data: { poeOwnerPct: Number(poeOwnerPct) },
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
