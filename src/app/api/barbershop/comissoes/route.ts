import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { startOfMonth, endOfMonth } from "date-fns";

function calcComissao(
  valor: number,
  type: string,
  rate: number
): number {
  if (type === "FIXED") return rate;
  return valor * (rate / 100);
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req, ["OWNER"]);
    const barbershopId = payload.barbershopId!;
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const barbers = await prisma.barber.findMany({
      where: { barbershopId, active: true },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Busca dados de cada barbeiro em paralelo
    const result = await Promise.all(barbers.map(async (b) => {
      const [avulsos, subAppointments, productSales] = await Promise.all([
        // Serviços avulsos finalizados
        prisma.appointment.findMany({
          where: {
            barberId: b.id,
            status: "DONE",
            subscriptionId: null,
            date: { gte: start, lte: end },
          },
          include: { service: true },
        }),
        // Serviços de assinatura finalizados
        prisma.appointment.findMany({
          where: {
            barberId: b.id,
            status: "DONE",
            subscriptionId: { not: null },
            date: { gte: start, lte: end },
          },
          include: { service: true },
        }),
        // Produtos vendidos
        prisma.productSale.findMany({
          where: {
            barberId: b.id,
            createdAt: { gte: start, lte: end },
          },
          include: { product: true },
        }),
      ]);

      // Cálculo avulso
      const totalAvulso = avulsos.reduce((s, a) => s + a.price, 0);
      const comissaoAvulso = avulsos.reduce((s, a) =>
        s + calcComissao(a.price, b.commissionType, b.commission), 0);

      // Cálculo assinatura (POE — o barbeiro recebe pelo split do pote)
      const totalAssinatura = subAppointments.length; // qtd de serviços

      // Cálculo produtos
      const totalProdutos = productSales.reduce((s, p) => s + p.total, 0);
      const comissaoProdutos = productSales.reduce((s, p) =>
        s + calcComissao(p.total, b.productCommissionType, b.productCommission), 0);

      const totalComissao = comissaoAvulso + comissaoProdutos;

      return {
        id: b.id,
        name: b.user.name,
        email: b.user.email,
        commissionType: b.commissionType,
        commission: b.commission,
        productCommissionType: b.productCommissionType,
        productCommission: b.productCommission,
        avulso: {
          atendimentos: avulsos.length,
          faturado: totalAvulso,
          comissao: comissaoAvulso,
        },
        assinatura: {
          servicos: totalAssinatura,
          // valor calculado via POE na tela de financeiro
        },
        produtos: {
          vendas: productSales.length,
          faturado: totalProdutos,
          comissao: comissaoProdutos,
        },
        totalComissao,
      };
    }));

    return NextResponse.json({ barbers: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

// Atualiza comissões de um barbeiro
export async function PATCH(req: NextRequest) {
  try {
    requireAuth(req, ["OWNER"]);
    const {
      barberId,
      commissionType, commission,
      productCommissionType, productCommission,
    } = await req.json();

    const barber = await prisma.barber.update({
      where: { id: barberId },
      data: {
        commissionType,
        commission: Number(commission),
        productCommissionType,
        productCommission: Number(productCommission),
      },
    });
    return NextResponse.json({ barber });
  } catch (e: unknown) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
