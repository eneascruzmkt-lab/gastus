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
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total do mês</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {formatBRL(totalToPay)}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Já pago</p>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
          {formatBRL(totalPaid)}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Vencimentos</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
