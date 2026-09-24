"use client";

interface PersonSummaryProps {
  perPerson: { name: string; total: number; income: number }[];
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getBarColor(pct: number): string {
  if (pct >= 80) return "bg-status-danger";
  if (pct >= 60) return "bg-status-pending";
  return "bg-status-success";
}

function getTextColor(pct: number): string {
  if (pct >= 80) return "text-status-danger";
  if (pct >= 60) return "text-status-pending";
  return "text-status-success";
}

export function PersonSummary({ perPerson }: PersonSummaryProps) {
  if (perPerson.length === 0) return null;

  return (
    <div className="bg-gastus-light-card dark:bg-gastus-card rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gastus-text mb-4">
        Gastos por pessoa
      </h2>
      <div className="space-y-5">
        {perPerson.map((person) => {
          const pct = person.income > 0
            ? Math.min(Math.round((person.total / person.income) * 100), 100)
            : 0;
          const libre = person.income - person.total;

          return (
            <div key={person.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-veridian-100 dark:bg-veridian-900/30 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-veridian-700 dark:text-veridian-400">
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gastus-text">
                    {person.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900 dark:text-gastus-text">
                    {formatBRL(person.total)}
                  </span>
                  {person.income > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gastus-text-secondary ml-1">
                      de {formatBRL(person.income)}
                    </span>
                  )}
                </div>
              </div>

              {person.income > 0 && (
                <>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                    <div
                      className={`h-2.5 rounded-full transition-all ${getBarColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs font-medium ${getTextColor(pct)}`}>
                      {pct}% comprometido
                    </span>
                    <span className={`text-xs ${libre >= 0 ? "text-gray-500 dark:text-gastus-text-secondary" : "text-status-danger font-medium"}`}>
                      {libre >= 0 ? `Sobra ${formatBRL(libre)}` : `Excede ${formatBRL(Math.abs(libre))}`}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
