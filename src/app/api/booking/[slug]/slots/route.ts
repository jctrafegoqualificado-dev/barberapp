import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const barberId = searchParams.get("barberId");
    const serviceId = searchParams.get("serviceId");

    if (!date || !barberId || !serviceId) {
      return NextResponse.json({ error: "Parâmetros obrigatórios" }, { status: 400 });
    }

    const shop = await prisma.barbershop.findUnique({ where: { slug: params.slug } });
    if (!shop) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: "Serviço inválido" }, { status: 404 });

    const d = new Date(date);
    const dayOfWeek = d.getDay();

    const openingHour = await prisma.openingHour.findFirst({
      where: { barbershopId: shop.id, dayOfWeek, isOpen: true },
    });

    if (!openingHour) return NextResponse.json({ slots: [] });

    const [openH, openM] = openingHour.openTime.split(":").map(Number);
    const [closeH, closeM] = openingHour.closeTime.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.appointment.findMany({
      where: {
        barberId,
        date: { gte: dayStart, lte: dayEnd },
        status: { not: "CANCELLED" },
      },
    });

    const slots: string[] = [];
    const step = 30;

    for (let m = openMinutes; m + service.duration <= closeMinutes; m += step) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      const slot = `${hh}:${mm}`;

      const slotEnd = m + service.duration;
      const conflict = existing.some((a) => {
        const [ah, am] = a.startTime.split(":").map(Number);
        const [eh, em] = a.endTime.split(":").map(Number);
        const aStart = ah * 60 + am;
        const aEnd = eh * 60 + em;
        return m < aEnd && slotEnd > aStart;
      });

      if (!conflict) slots.push(slot);
    }

    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
