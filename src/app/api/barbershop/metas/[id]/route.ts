import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAuth(req, ["OWNER"]);
    await prisma.meta.update({ where: { id: params.id }, data: { active: false } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAuth(req, ["OWNER"]);
    const { titulo, valorAlvo } = await req.json();
    const meta = await prisma.meta.update({
      where: { id: params.id },
      data: { titulo, valorAlvo: Number(valorAlvo) },
    });
    return NextResponse.json({ meta });
  } catch (e: unknown) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
