"use client";

interface SummaryCardsProps {
  totalToPay: number;
  totalPaid: number;
  dueCount: number;
  selfDebtTotal?: number;
  totalDebt?: number;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function SummaryCards({ totalToPay, totalPaid, dueCount, selfDebtTotal, totalDebt }: SummaryCardsProps) {
  const extraCards = [totalDebt && totalDebt > 0, selfDebtTotal && selfDebtTotal > 0].filter(Boolean).length;
  const cols = 3 + extraCards;
  const gridClass = cols === 5 ? "sm:grid-cols-5" : cols === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridClass}`}>
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

      {totalDebt != null && totalDebt > 0 && (
        <div className="bg-status-danger/5 dark:bg-status-danger/10 rounded-xl shadow-sm p-6">
          <p className="text-sm text-status-danger/80 mb-1">Dívida total</p>
          <p className="text-2xl font-bold text-status-danger">
            {formatBRL(totalDebt)}
          </p>
        </div>
      )}

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
