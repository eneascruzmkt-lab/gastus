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

  const person = await prisma.person.findFirst({ where: { id, userId } });
  if (!person) return NextResponse.json({ error: "Pessoa não encontrada" }, { status: 404 });

  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const updated = await prisma.person.update({
    where: { id },
    data: { name: name.trim() },
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

  const person = await prisma.person.findFirst({ where: { id, userId } });
  if (!person) return NextResponse.json({ error: "Pessoa não encontrada" }, { status: 404 });

  if (person.name === "Eu") {
    return NextResponse.json({ error: "Não é possível excluir a pessoa \"Eu\"" }, { status: 400 });
  }

  const hasExpenses = await prisma.expense.count({ where: { personId: id } });
  if (hasExpenses > 0) {
    return NextResponse.json(
      { error: "Essa pessoa possui gastos vinculados. Remova os gastos primeiro." },
      { status: 400 }
    );
  }

  await prisma.person.delete({ where: { id } });
  return NextResponse.json({ message: "Pessoa excluída" });
}
