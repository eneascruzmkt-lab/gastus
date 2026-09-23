import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, addMonths } from "date-fns";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const { id } = await params;
  const { quantity } = await request.json();

  const expense = await prisma.expense.findFirst({
    where: { id, userId, type: "INSTALLMENT", active: true },
  });

  if (!expense || !expense.remainingInstallments || !expense.installmentValue) {
    return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
  }

  const remaining = expense.remainingInstallments;
  const toAdvance = Math.min(quantity, remaining);
  const newRemaining = remaining - toAdvance;
  const now = new Date();

  // Create payment records for advanced installments, each with its correct future referenceMonth
  const paidCount = await prisma.payment.count({ where: { expenseId: expense.id } });
  const payments = Array.from({ length: toAdvance }, (_, i) => {
    const monthOffset = paidCount + i;
    const refDate = addMonths(expense.startDate!, monthOffset);
    return {
      expenseId: expense.id,
      value: expense.installmentValue!,
      paymentDate: now,
      referenceMonth: format(refDate, "yyyy-MM"),
    };
  });

  await prisma.$transaction([
    prisma.payment.createMany({ data: payments }),
    prisma.expense.update({
      where: { id: expense.id },
      data: {
        remainingInstallments: newRemaining,
        active: newRemaining <= 0 ? false : true,
      },
    }),
  ]);

  return NextResponse.json({
    message: newRemaining <= 0
      ? "Compra finalizada!"
      : `${toAdvance} parcela(s) adiantada(s). Restam ${newRemaining}.`,
    remaining: newRemaining,
    finalized: newRemaining <= 0,
  });
}
