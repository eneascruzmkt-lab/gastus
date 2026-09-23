import { Payment } from "@/generated/prisma/client";
import { getDueDate, nowBrazil } from "./date";

export type ExpenseStatus = "pendente" | "pago" | "atrasado";

export function computeStatus(
  dueDay: number,
  referenceMonth: string,
  payments: Payment[]
): ExpenseStatus {
  const isPaid = payments.some((p) => p.referenceMonth === referenceMonth);
  if (isPaid) return "pago";

  const dueDate = getDueDate(dueDay, referenceMonth);
  const now = nowBrazil();

  // Mark as "atrasado" starting the day AFTER the due date
  const dueDateEnd = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + 1);
  if (now >= dueDateEnd) return "atrasado";
  return "pendente";
}
