import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req, ["OWNER"]);
    const barbershopId = payload.barbershopId!;
    const barbers = await prisma.barber.findMany({
      where: { barbershopId },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { user: { name: "asc" } },
    });
    return NextResponse.json({ barbers });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req, ["OWNER"]);
    const barbershopId = payload.barbershopId!;
    const { name, email, phone, password, commission, nickname } = await req.json();

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const hashed = await hashPassword(password || "barber123");
      user = await prisma.user.create({
        data: { name, email, phone, password: hashed, role: "BARBER" },
      });
    }

    const barber = await prisma.barber.create({
      data: { userId: user.id, barbershopId, commission: Number(commission) || 50, nickname },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    });

    return NextResponse.json({ barber }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
