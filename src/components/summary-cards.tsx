"use client";

interface SummaryCardsProps {
  totalToPay: number;
  installmentTotal: number;
  fixedTotal: number;
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

export function SummaryCards({
  totalToPay,
  installmentTotal,
  fixedTotal,
  totalPaid,
  dueCount,
  selfDebtTotal,
  totalDebt,
}: SummaryCardsProps) {
  return (
    <div className="space-y-4">
      {/* Linha principal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gastus-light-card dark:bg-gastus-card rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 dark:text-gastus-text-secondary mb-1">Total do mês</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gastus-text">
            {formatBRL(totalToPay)}
          </p>
          <div className="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gastus-text-secondary">
            <span>Parcelas {formatBRL(installmentTotal)}</span>
            <span>Gastos {formatBRL(fixedTotal)}</span>
          </div>
        </div>

        <div className="bg-gastus-light-card dark:bg-gastus-card rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 dark:text-gastus-text-secondary mb-1">Parcelas pagas</p>
          <p className="text-2xl font-bold text-status-success">
            {formatBRL(totalPaid)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gastus-text-secondary mt-2">
            de {formatBRL(installmentTotal)} em parcelas
          </p>
        </div>

        <div className="bg-gastus-light-card dark:bg-gastus-card rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 dark:text-gastus-text-secondary mb-1">Vencimentos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gastus-text">
            {dueCount}
          </p>
          <p className="text-xs text-gray-500 dark:text-gastus-text-secondary mt-2">
            parcelas pendentes
          </p>
        </div>
      </div>

      {/* Linha secundária — dívida e self-debt */}
      {((totalDebt != null && totalDebt > 0) || (selfDebtTotal != null && selfDebtTotal > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {totalDebt != null && totalDebt > 0 && (
            <div className="bg-status-danger/5 dark:bg-status-danger/10 rounded-xl shadow-sm p-6">
              <p className="text-sm text-status-danger/80 mb-1">Dívida total</p>
              <p className="text-2xl font-bold text-status-danger">
                {formatBRL(totalDebt)}
              </p>
              <p className="text-xs text-status-danger/60 mt-2">
                soma de todas as parcelas restantes
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
      )}
    </div>
  );
}
