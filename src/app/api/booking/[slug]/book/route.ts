import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { clientName, clientEmail, clientPhone, barberId, serviceId, date, startTime, subscriptionId } =
      await req.json();

    const shop = await prisma.barbershop.findUnique({ where: { slug } });
    if (!shop) return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 });

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: "Serviço inválido" }, { status: 404 });

    let client = await prisma.user.findUnique({ where: { email: clientEmail } });
    if (!client) {
      const hashed = await hashPassword(clientPhone || "client123");
      client = await prisma.user.create({
        data: { name: clientName, email: clientEmail, phone: clientPhone, password: hashed, role: "CLIENT" },
      });
    }

    const [h, m] = startTime.split(":").map(Number);
    const endMin = h * 60 + m + service.duration;
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(date),
        startTime,
        endTime,
        price: service.price,
        clientId: client.id,
        barbershopId: shop.id,
        barberId,
        serviceId,
        status: "CONFIRMED",
        ...(subscriptionId ? { subscriptionId } : {}),
      },
    });

    return NextResponse.json({ appointment, message: "Agendamento confirmado!" }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
