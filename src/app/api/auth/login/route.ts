import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    let barbershopId: string | undefined;
    if (user.role === "OWNER") {
      const shop = await prisma.barbershop.findUnique({ where: { ownerId: user.id } });
      barbershopId = shop?.id;
    } else if (user.role === "BARBER") {
      const barber = await prisma.barber.findUnique({ where: { userId: user.id } });
      barbershopId = barber?.barbershopId;
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, barbershopId });

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, barbershopId },
      token,
    });

    res.cookies.set("token", token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
