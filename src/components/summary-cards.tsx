"use client";

interface SummaryCardsProps {
  totalToPay: number;
  totalPaid: number;
  dueCount: number;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function SummaryCards({ totalToPay, totalPaid, dueCount }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total do mes</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {formatBRL(totalToPay)}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ja pago</p>
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
    </div>
  );
}
