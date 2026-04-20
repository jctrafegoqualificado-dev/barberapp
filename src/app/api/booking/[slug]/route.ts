import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const shop = await prisma.barbershop.findUnique({
      where: { slug: params.slug, active: true },
      include: {
        services: { where: { active: true }, orderBy: { name: "asc" } },
        barbers: {
          where: { active: true },
          include: { user: { select: { name: true } } },
        },
        openingHours: { orderBy: { dayOfWeek: "asc" } },
      },
    });

    if (!shop) return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 });
    return NextResponse.json({ shop });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
