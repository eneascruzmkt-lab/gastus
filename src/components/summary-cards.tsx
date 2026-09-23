"use client";

interface SummaryCardsProps {
  totalToPay: number;
  totalPaid: number;
  dueCount: number;
  selfDebtTotal?: number;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function SummaryCards({ totalToPay, totalPaid, dueCount, selfDebtTotal }: SummaryCardsProps) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${selfDebtTotal && selfDebtTotal > 0 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
      <div className="bg-gastus-light-card dark:bg-gastus-card rounded-xl shadow-sm p-6">
        <p className="text-sm text-gray-500 dark:text-gastus-text-secondary mb-1">Total do mês</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gastus-text">
          {formatBRL(totalToPay)}
        </p>
      </div>

      <div className="bg-gastus-light-card dark:bg-gastus-card rounded-xl shadow-sm p-6">
        <p className="text-sm text-gray-500 dark:text-gastus-text-secondary mb-1">Já pago</p>
        <p className="text-2xl font-bold text-status-success">
          {formatBRL(totalPaid)}
        </p>
      </div>

      <div className="bg-gastus-light-card dark:bg-gastus-card rounded-xl shadow-sm p-6">
        <p className="text-sm text-gray-500 dark:text-gastus-text-secondary mb-1">Vencimentos</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gastus-text">
          {dueCount}
        </p>
      </div>

      {selfDebtTotal != null && selfDebtTotal > 0 && (
        <div className="bg-veridian-50 dark:bg-veridian-950/30 rounded-xl shadow-sm p-6">
          <p className="text-sm text-veridian-600 dark:text-veridian-400 mb-1">Devendo a mim</p>
          <p className="text-2xl font-bold text-veridian-700 dark:text-veridian-300">
            {formatBRL(selfDebtTotal)}
          </p>
        </div>
      )}
    </div>
  );
}
