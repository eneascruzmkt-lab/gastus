import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNtfyNotification } from "@/lib/ntfy";
import { nowBrazil } from "@/lib/date";
import { addDays, addMonths, format } from "date-fns";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const now = nowBrazil();

  const users = await prisma.user.findMany({
    where: { ntfyTopic: { not: null } },
  });

  let sent = 0;

  for (const user of users) {
    const checkDate = addDays(now, user.notifyDaysBefore);
    const checkDay = checkDate.getDate();
    const checkMonth = format(checkDate, "yyyy-MM");

    const expenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        active: true,
        dueDay: checkDay,
        payments: {
          none: { referenceMonth: checkMonth },
        },
      },
      include: { payments: true },
    });

    for (const expense of expenses) {
      // ONE_TIME: only notify in the correct dueMonth
      if (expense.type === "ONE_TIME" && expense.dueMonth !== null) {
        const checkMonthNum = parseInt(checkMonth.split("-")[1]);
        if (checkMonthNum !== expense.dueMonth) continue;
      }

      // INSTALLMENT: check if this month falls within the installment range
      if (expense.type === "INSTALLMENT" && expense.startDate && expense.totalInstallments) {
        const startMonth = new Date(expense.startDate);
        const endMonth = addMonths(startMonth, expense.totalInstallments - 1);
        const checkDate2 = new Date(parseInt(checkMonth.split("-")[0]), parseInt(checkMonth.split("-")[1]) - 1, 1);
        if (checkDate2 < new Date(startMonth.getFullYear(), startMonth.getMonth(), 1) || checkDate2 > endMonth) continue;
      }

      const success = await sendNtfyNotification(
        user.ntfyTopic!,
        `Vencimento próximo: ${expense.name}`,
        `R$ ${expense.installmentValue || expense.totalValue} vence dia ${expense.dueDay}/${checkMonth.split("-")[1]}`
      );
      if (success) sent++;
    }
  }

  return NextResponse.json({ message: `${sent} notificação(ões) enviada(s)` });
}
