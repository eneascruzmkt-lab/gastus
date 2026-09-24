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
  const body = await request.json();

  const expense = await prisma.expense.findFirst({
    where: { id, userId },
  });

  if (!expense) {
    return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      name: body.name ?? expense.name,
      categoryId: body.categoryId ?? expense.categoryId,
      personId: body.personId !== undefined ? (body.personId || null) : expense.personId,
      totalValue: body.totalValue ?? expense.totalValue,
      installmentValue: body.installmentValue ?? expense.installmentValue,
      totalInstallments: body.totalInstallments ?? expense.totalInstallments,
      remainingInstallments: body.remainingInstallments ?? expense.remainingInstallments,
      startDate: body.startDate ? new Date(body.startDate) : expense.startDate,
      dueDay: body.dueDay ?? expense.dueDay,
      dueMonth: body.dueMonth ?? expense.dueMonth,
      repeatsYearly: body.repeatsYearly ?? expense.repeatsYearly,
      recurringInterval: body.recurringInterval ?? expense.recurringInterval,
      active: body.active ?? expense.active,
    },
    include: { category: true },
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

  const expense = await prisma.expense.findFirst({
    where: { id, userId },
  });

  if (!expense) {
    return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ message: "Gasto excluído" });
}
