import { format, addMonths } from "date-fns";

const BRAZIL_OFFSET = -3;

export function nowBrazil(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + BRAZIL_OFFSET * 3600000);
}

export function todayBrazil(): string {
  return format(nowBrazil(), "yyyy-MM-dd");
}

export function currentMonthBrazil(): string {
  return format(nowBrazil(), "yyyy-MM");
}

export function getDueDate(dueDay: number, referenceMonth: string): Date {
  const [year, month] = referenceMonth.split("-").map(Number);
  return new Date(year, month - 1, dueDay);
}

export function getInstallmentMonth(startDate: Date, offset: number): string {
  const date = addMonths(startDate, offset);
  return format(date, "yyyy-MM");
}
