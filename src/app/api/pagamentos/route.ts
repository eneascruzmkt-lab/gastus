import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentMonthBrazil } from "@/lib/date";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const { expenseId, value, referenceMonth } = await request.json();

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  if (!expense) {
    return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
  }

  const month = referenceMonth || currentMonthBrazil();

  if (expense.type !== "SELF_DEBT") {
    const existingPayment = await prisma.payment.findFirst({
      where: { expenseId, referenceMonth: month },
    });

    if (existingPayment) {
      return NextResponse.json({ error: "Já foi marcado como pago neste mês" }, { status: 400 });
    }
  }

  const payment = await prisma.payment.create({
    data: {
      expenseId,
      value: value || expense.installmentValue || expense.totalValue,
      paymentDate: new Date(),
      referenceMonth: month,
    },
  });

  // For installments, decrease remaining
  if (expense.type === "INSTALLMENT" && expense.remainingInstallments) {
    const newRemaining = expense.remainingInstallments - 1;
    await prisma.expense.update({
      where: { id: expense.id },
      data: {
        remainingInstallments: newRemaining,
        active: newRemaining <= 0 ? false : true,
      },
    });
  }

  // For non-repeating one-time, deactivate after payment
  if (expense.type === "ONE_TIME" && !expense.repeatsYearly) {
    await prisma.expense.update({
      where: { id: expense.id },
      data: { active: false },
    });
  }

  // For self-debt, check if fully paid
  if (expense.type === "SELF_DEBT") {
    const allPayments = await prisma.payment.findMany({
      where: { expenseId: expense.id },
    });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.value, 0);
    if (totalPaid >= expense.totalValue) {
      await prisma.expense.update({
        where: { id: expense.id },
        data: { active: false },
      });
    }
  }

  return NextResponse.json(payment);
}
