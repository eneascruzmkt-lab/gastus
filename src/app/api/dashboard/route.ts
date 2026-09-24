import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentMonthBrazil, billingMonth } from "@/lib/date";
import { computeStatus, ExpenseStatus } from "@/lib/status";
import { addMonths, subMonths, format } from "date-fns";

/**
 * Calcula o mês final efetivo de uma parcela.
 * Se houve adiantamento, o fim é anterior ao original.
 * Se não, retorna o fim original.
 * Nunca altera totalInstallments.
 */
function getEffectiveEnd(
  startDate: Date,
  totalInstallments: number,
  active: boolean,
  remainingInstallments: number | null,
  dueDay: number
): string {
  const originalEnd = format(
    addMonths(startDate, totalInstallments - 1),
    "yyyy-MM"
  );

  if (active && remainingInstallments != null && remainingInstallments > 0) {
    const billing = billingMonth(dueDay);
    const [by, bm] = billing.split("-").map(Number);
    const effectiveEndDate = addMonths(new Date(by, bm - 1, 1), remainingInstallments - 1);
    const effectiveEnd = format(effectiveEndDate, "yyyy-MM");
    // Só usa o efetivo se for ANTERIOR ao original (houve adiantamento)
    if (effectiveEnd < originalEnd) {
      return effectiveEnd;
    }
  }

  return originalEnd;
}

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
    include: { category: true, payments: true, person: true },
  });

  // Filter expenses that appear in the current billing month
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
    if (!expense.active && expense.type !== "INSTALLMENT") continue;
    if (expense.type === "SELF_DEBT") continue;
    if (expense.category.name === "Terceiro") continue;

    let appearsThisMonth = false;
    let value = 0;

    switch (expense.type) {
      case "RECURRING": {
        const interval = expense.recurringInterval || 1;
        if (interval === 1) {
          appearsThisMonth = true;
        } else {
          const createdMonth = expense.createdAt.getFullYear() * 12 + expense.createdAt.getMonth();
          const currentMonth = refYear * 12 + (refMonthNum - 1);
          appearsThisMonth = (currentMonth - createdMonth) % interval === 0;
        }
        if (appearsThisMonth) value = expense.totalValue;
        break;
      }

      case "ONE_TIME":
        if (expense.dueMonth === refMonthNum) {
          appearsThisMonth = true;
          value = expense.totalValue;
        }
        break;

      case "INSTALLMENT":
        if (expense.startDate && expense.totalInstallments) {
          const startMonth = format(expense.startDate, "yyyy-MM");
          const endMonth = getEffectiveEnd(
            expense.startDate,
            expense.totalInstallments,
            expense.active,
            expense.remainingInstallments,
            expense.dueDay
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

  // Summary — separar parcelas de gastos recorrentes/fixos
  const installmentItems = items.filter((i) => i.type === "INSTALLMENT");
  const fixedItems = items.filter((i) => i.type === "RECURRING" || i.type === "ONE_TIME");

  const totalToPay = items.reduce((sum, i) => sum + i.value, 0);
  const installmentTotal = installmentItems.reduce((sum, i) => sum + i.value, 0);
  const fixedTotal = fixedItems.reduce((sum, i) => sum + i.value, 0);
  const totalPaid = installmentItems
    .filter((i) => i.status === "pago")
    .reduce((sum, i) => sum + i.value, 0);
  const dueCount = installmentItems.filter(
    (i) => i.status === "pendente" || i.status === "atrasado"
  ).length;

  // Projection: from January of current year until last installment ends
  let lastEndDate = new Date(refYear, 11, 1); // default: December of current year
  for (const expense of allExpenses) {
    if (expense.type === "INSTALLMENT" && expense.startDate && expense.totalInstallments) {
      const endStr = getEffectiveEnd(
        expense.startDate,
        expense.totalInstallments,
        expense.active,
        expense.remainingInstallments,
        expense.dueDay
      );
      const [ey, em] = endStr.split("-").map(Number);
      const endDate = new Date(ey, em - 1, 1);
      if (endDate > lastEndDate) lastEndDate = endDate;
    }
  }

  const projStartDate = new Date(refYear, 0, 1); // January of current year
  const totalProjMonths = (lastEndDate.getFullYear() - refYear) * 12 + lastEndDate.getMonth() + 1;

  const projection: { month: string; parcelas: number; byPerson: Record<string, number> }[] = [];
  for (let offset = 0; offset < totalProjMonths; offset++) {
    const projDate = addMonths(projStartDate, offset);
    const projMonth = format(projDate, "yyyy-MM");
    const projMonthNum = projDate.getMonth() + 1;
    let parcelas = 0;
    const byPerson: Record<string, number> = {};

    for (const expense of allExpenses) {
      if (!expense.active && expense.type !== "INSTALLMENT") continue;
      if (expense.type === "SELF_DEBT") continue;
      if (expense.category.name === "Terceiro") continue;

      switch (expense.type) {
        case "RECURRING":
          if (expense.active) {
            const interval = expense.recurringInterval || 1;
            let appearsThisMonth = false;
            if (interval === 1) {
              appearsThisMonth = true;
            } else {
              const createdMonth = expense.createdAt.getFullYear() * 12 + expense.createdAt.getMonth();
              const pMonth = projDate.getFullYear() * 12 + projDate.getMonth();
              appearsThisMonth = (pMonth - createdMonth) % interval === 0;
            }
            if (appearsThisMonth) {
              const personName = expense.person?.name ?? "Eu";
              byPerson[personName] = (byPerson[personName] || 0) + expense.totalValue;
            }
          }
          break;

        case "ONE_TIME":
          if (expense.active && expense.dueMonth === projMonthNum) {
            const personName = expense.person?.name ?? "Eu";
            byPerson[personName] = (byPerson[personName] || 0) + expense.totalValue;
          }
          break;

        case "INSTALLMENT":
          if (expense.startDate && expense.totalInstallments) {
            const startMonth = format(expense.startDate, "yyyy-MM");
            const endMonth = getEffectiveEnd(
              expense.startDate,
              expense.totalInstallments,
              expense.active,
              expense.remainingInstallments,
              expense.dueDay
            );
            if (projMonth >= startMonth && projMonth <= endMonth) {
              parcelas += expense.installmentValue || expense.totalValue;
            }
          }
          break;
      }
    }

    projection.push({ month: projMonth, parcelas, byPerson });
  }

  // Freedom alerts: installments that were finalized last month
  // Uses the last payment's referenceMonth to detect when it actually ended
  // (accounts for advances that finish the expense earlier than the original schedule)
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
      expense.payments.length > 0
    ) {
      // Pegar o mês da última parcela paga para saber quando realmente finalizou
      const lastPaymentMonth = expense.payments
        .map((p) => p.referenceMonth)
        .sort()
        .pop();
      if (lastPaymentMonth === lastMonth) {
        freedomAlerts.push({
          name: expense.name,
          freedValue: expense.installmentValue || expense.totalValue,
        });
      }
    }
  }

  // Total debt: sum of remaining installments × installment value (all active installments)
  const totalDebt = allExpenses.reduce((sum, expense) => {
    if (
      expense.type === "INSTALLMENT" &&
      expense.active &&
      expense.remainingInstallments &&
      expense.installmentValue &&
      expense.category.name !== "Terceiro"
    ) {
      return sum + expense.installmentValue * expense.remainingInstallments;
    }
    return sum;
  }, 0);

  // Self-debt summary (separate from monthly expenses)
  const selfDebts = await prisma.expense.findMany({
    where: { userId, type: "SELF_DEBT", active: true },
    include: { payments: true },
  });

  const selfDebtTotal = selfDebts.reduce((sum, debt) => {
    const paid = debt.payments.reduce((s, p) => s + p.value, 0);
    return sum + (debt.totalValue - paid);
  }, 0);

  // Per-person summary (only RECURRING and ONE_TIME, active)
  const persons = await prisma.person.findMany({ where: { userId } });
  const personTotals = new Map<string, { name: string; total: number; income: number }>();

  // Inicializar com todas as pessoas (mesmo sem gastos)
  for (const p of persons) {
    personTotals.set(p.name, { name: p.name, total: 0, income: p.income });
  }

  for (const expense of allExpenses) {
    if (!expense.active) continue;
    if (expense.type !== "RECURRING" && expense.type !== "ONE_TIME") continue;
    if (expense.category.name === "Terceiro") continue;

    const personName = expense.person?.name ?? "Eu";
    const current = personTotals.get(personName) || { name: personName, total: 0, income: 0 };
    current.total += expense.totalValue;
    personTotals.set(personName, current);
  }
  const perPerson = Array.from(personTotals.values())
    .filter((p) => p.total > 0 || p.income > 0)
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({
    refMonth,
    items,
    summary: { totalToPay, totalPaid, dueCount, installmentTotal, fixedTotal },
    projection,
    freedomAlerts,
    selfDebtTotal,
    totalDebt,
    perPerson,
  });
}
