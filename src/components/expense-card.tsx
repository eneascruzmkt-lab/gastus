"use client";

interface Category {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  name: string;
  type: "INSTALLMENT" | "RECURRING" | "ONE_TIME";
  totalValue: number;
  installmentValue?: number | null;
  totalInstallments?: number | null;
  remainingInstallments?: number | null;
  startDate?: string | null;
  dueDay: number;
  dueMonth?: number | null;
  repeatsYearly?: boolean;
  active: boolean;
  category?: Category | null;
}

interface ExpenseCardProps {
  expense: Expense;
  children?: React.ReactNode;
}

const monthNames = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isLastOnNextBill(expense: Expense): boolean {
  if (expense.type !== "INSTALLMENT" || expense.remainingInstallments !== 1) return false;
  if (!expense.startDate || !expense.totalInstallments) return false;
  const start = new Date(expense.startDate);
  const lastMonth = new Date(start.getFullYear(), start.getMonth() + expense.totalInstallments - 1, 1);
  const now = new Date();
  const nextBill = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return lastMonth.getFullYear() === nextBill.getFullYear() && lastMonth.getMonth() === nextBill.getMonth();
}

export function ExpenseCard({ expense, children }: ExpenseCardProps) {
  const inactive = !expense.active;
  const finalizesNextBill = !inactive && isLastOnNextBill(expense);

  return (
    <div
      className={`bg-gastus-light-card dark:bg-gastus-card rounded-xl shadow-sm p-4 border border-gastus-light-border dark:border-gastus-border ${
        inactive ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-gastus-text truncate">
              {expense.name}
            </h3>
            {expense.category?.name === "Terceiro" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-status-info/10 text-status-info font-medium shrink-0">
                Terceiro
              </span>
            )}
            {expense.type === "ONE_TIME" && expense.repeatsYearly && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-veridian-100 dark:bg-veridian-900/30 text-veridian-700 dark:text-veridian-400 font-medium shrink-0">
                Anual
              </span>
            )}
          </div>

          {expense.category && (
            <p className="text-sm text-gray-500 dark:text-gastus-text-secondary mb-2">
              {expense.category.name}
            </p>
          )}

          {/* INSTALLMENT specific */}
          {expense.type === "INSTALLMENT" && (
            <div className="space-y-2">
              <p className="text-sm text-gray-700 dark:text-gastus-text-secondary">
                <span className="font-medium text-veridian-600 dark:text-veridian-400">
                  {formatCurrency(expense.installmentValue ?? 0)}
                </span>
                /mês
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all bg-gradient-to-r from-veridian-500 to-status-success"
                  style={{
                    width: `${
                      expense.totalInstallments
                        ? Math.min(
                            ((expense.totalInstallments - (expense.remainingInstallments ?? 0) + ((expense.remainingInstallments ?? 0) > 0 ? 1 : 0)) /
                              expense.totalInstallments) *
                              100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gastus-text-secondary">
                Parcela{" "}
                {(expense.remainingInstallments ?? 0) === 0
                  ? expense.totalInstallments
                  : (expense.totalInstallments ?? 0) - (expense.remainingInstallments ?? 0) + 1}{" "}
                de {expense.totalInstallments}
              </p>
              {finalizesNextBill && (
                <p className="text-xs font-medium text-veridian-600 dark:text-veridian-400 mt-1">
                  Finaliza na próxima fatura
                </p>
              )}
            </div>
          )}

          {/* RECURRING specific */}
          {expense.type === "RECURRING" && (
            <div className="space-y-1">
              <p className="text-sm text-gray-700 dark:text-gastus-text-secondary">
                <span className="font-medium text-veridian-600 dark:text-veridian-400">
                  {formatCurrency(expense.totalValue)}
                </span>
                /mês
              </p>
              <p className="text-xs text-gray-500 dark:text-gastus-text-secondary">
                Vencimento: dia {expense.dueDay}
              </p>
            </div>
          )}

          {/* ONE_TIME specific */}
          {expense.type === "ONE_TIME" && (
            <div className="space-y-1">
              <p className="text-sm text-gray-700 dark:text-gastus-text-secondary">
                <span className="font-medium text-veridian-600 dark:text-veridian-400">
                  {formatCurrency(expense.totalValue)}
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gastus-text-secondary">
                Vencimento: {expense.dueMonth ? monthNames[expense.dueMonth] + ", " : ""}dia{" "}
                {expense.dueDay}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {children && (
          <div className="flex items-center gap-1 shrink-0 flex-wrap">{children}</div>
        )}
      </div>
    </div>
  );
}
