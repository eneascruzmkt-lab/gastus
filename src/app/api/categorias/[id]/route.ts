import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const { id } = await params;
  const { name } = await request.json();

  const category = await prisma.category.findFirst({
    where: { id, userId, predefined: false },
  });

  if (!category) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  const updated = await prisma.category.update({
    where: { id },
    data: { name },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const { id } = await params;

  const category = await prisma.category.findFirst({
    where: { id, userId, predefined: false },
  });

  if (!category) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  const outrosCategory = await prisma.category.findFirst({
    where: { name: "Outros", predefined: true },
  });

  if (outrosCategory) {
    await prisma.expense.updateMany({
      where: { categoryId: id, userId },
      data: { categoryId: outrosCategory.id },
    });
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ message: "Categoria excluída" });
}
