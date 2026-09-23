import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentMonthBrazil } from "@/lib/date";
import { computeStatus, ExpenseStatus } from "@/lib/status";
import { addMonths, subMonths, format } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const refMonth = currentMonthBrazil();
  const [refYear, refMonthNum] = refMonth.split("-").map(Number);

  // Fetch all expenses (active + recently finished for freedom alerts)
  const allExpenses = await prisma.expense.findMany({
    where: { userId },
    include: { category: true, payments: true },
  });

  // Filter expenses that appear in the current month
  const items: {
    id: string;
    name: string;
    type: string;
    dueDay: number;
    totalValue: number;
    installmentValue: number | null;
    totalInstallments: number | null;
    remainingInstallments: number | null;
    startDate: Date | null;
    dueMonth: number | null;
    repeatsYearly: boolean;
    active: boolean;
    category: { id: string; name: string };
    status: ExpenseStatus;
    value: number;
  }[] = [];

  for (const expense of allExpenses) {
    if (!expense.active) continue;
    if (expense.type === "SELF_DEBT") continue;
    if (expense.category.name === "Terceiro") continue;

    let appearsThisMonth = false;
    let value = 0;

    switch (expense.type) {
      case "RECURRING":
        appearsThisMonth = true;
        value = expense.totalValue;
        break;

      case "ONE_TIME":
        if (expense.dueMonth === refMonthNum) {
          appearsThisMonth = true;
          value = expense.totalValue;
        }
        break;

      case "INSTALLMENT":
        if (expense.startDate && expense.totalInstallments) {
          const startMonth = format(expense.startDate, "yyyy-MM");
          const endMonth = format(
            addMonths(expense.startDate, expense.totalInstallments - 1),
            "yyyy-MM"
          );
          if (refMonth >= startMonth && refMonth <= endMonth) {
            appearsThisMonth = true;
            value = expense.installmentValue || expense.totalValue;
          }
        }
        break;
    }

    if (appearsThisMonth) {
      const status = computeStatus(expense.dueDay, refMonth, expense.payments);
      items.push({
        id: expense.id,
        name: expense.name,
        type: expense.type,
        dueDay: expense.dueDay,
        totalValue: expense.totalValue,
        installmentValue: expense.installmentValue,
        totalInstallments: expense.totalInstallments,
        remainingInstallments: expense.remainingInstallments,
        startDate: expense.startDate,
        dueMonth: expense.dueMonth,
        repeatsYearly: expense.repeatsYearly,
        active: expense.active,
        category: { id: expense.category.id, name: expense.category.name },
        status,
        value,
      });
    }
  }

  // Sort by dueDay ascending
  items.sort((a, b) => a.dueDay - b.dueDay);

  // Summary
  const totalToPay = items.reduce((sum, i) => sum + i.value, 0);
  const totalPaid = items
    .filter((i) => i.status === "pago")
    .reduce((sum, i) => sum + i.value, 0);
  const dueCount = items.filter(
    (i) => i.status === "pendente" || i.status === "atrasado"
  ).length;

  // Projection: from January of current year until last installment ends
  // Find the latest end month among all installments
  let lastEndDate = new Date(refYear, 11, 1); // default: December of current year
  for (const expense of allExpenses) {
    if (expense.type === "INSTALLMENT" && expense.startDate && expense.totalInstallments) {
      const endDate = addMonths(expense.startDate, expense.totalInstallments - 1);
      if (endDate > lastEndDate) lastEndDate = endDate;
    }
  }

  const projStartDate = new Date(refYear, 0, 1); // January of current year
  const totalProjMonths = (lastEndDate.getFullYear() - refYear) * 12 + lastEndDate.getMonth() + 1;

  const projection: { month: string; total: number }[] = [];
  for (let offset = 0; offset < totalProjMonths; offset++) {
    const projDate = addMonths(projStartDate, offset);
    const projMonth = format(projDate, "yyyy-MM");
    const projMonthNum = projDate.getMonth() + 1;
    let total = 0;

    for (const expense of allExpenses) {
      if (!expense.active && expense.type !== "INSTALLMENT") continue;
      if (expense.type === "SELF_DEBT") continue;
      if (expense.category.name === "Terceiro") continue;

      switch (expense.type) {
        case "RECURRING":
          if (expense.active) total += expense.totalValue;
          break;

        case "ONE_TIME":
          if (expense.active && expense.dueMonth === projMonthNum) {
            total += expense.totalValue;
          }
          break;

        case "INSTALLMENT":
          if (expense.startDate && expense.totalInstallments) {
            const startMonth = format(expense.startDate, "yyyy-MM");
            const endMonth = format(
              addMonths(expense.startDate, expense.totalInstallments - 1),
              "yyyy-MM"
            );
            if (projMonth >= startMonth && projMonth <= endMonth) {
              total += expense.installmentValue || expense.totalValue;
            }
          }
          break;
      }
    }

    projection.push({ month: projMonth, total });
  }

  // Freedom alerts: installments that finished last month
  const lastMonth = format(
    subMonths(new Date(refYear, refMonthNum - 1, 1), 1),
    "yyyy-MM"
  );

  const freedomAlerts: { name: string; freedValue: number }[] = [];
  for (const expense of allExpenses) {
    if (
      expense.type === "INSTALLMENT" &&
      !expense.active &&
      expense.remainingInstallments === 0 &&
      expense.startDate &&
      expense.totalInstallments
    ) {
      const endMonth = format(
        addMonths(expense.startDate, expense.totalInstallments - 1),
        "yyyy-MM"
      );
      if (endMonth === lastMonth) {
        freedomAlerts.push({
          name: expense.name,
          freedValue: expense.installmentValue || expense.totalValue,
        });
      }
    }
  }

  // Self-debt summary (separate from monthly expenses)
  const selfDebts = await prisma.expense.findMany({
    where: { userId, type: "SELF_DEBT", active: true },
    include: { payments: true },
  });

  const selfDebtTotal = selfDebts.reduce((sum, debt) => {
    const paid = debt.payments.reduce((s, p) => s + p.value, 0);
    return sum + (debt.totalValue - paid);
  }, 0);

  return NextResponse.json({
    refMonth,
    items,
    summary: { totalToPay, totalPaid, dueCount },
    projection,
    freedomAlerts,
    selfDebtTotal,
  });
}
