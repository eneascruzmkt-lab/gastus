"use client";

interface PersonSummaryProps {
  perPerson: { name: string; total: number }[];
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function PersonSummary({ perPerson }: PersonSummaryProps) {
  if (perPerson.length === 0) return null;

  const total = perPerson.reduce((sum, p) => sum + p.total, 0);

  return (
    <div className="bg-gastus-light-card dark:bg-gastus-card rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gastus-text mb-4">
        Gastos por pessoa
      </h2>
      <div className="space-y-3">
        {perPerson.map((person) => {
          const pct = total > 0 ? ((person.total / total) * 100).toFixed(0) : "0";
          return (
            <div key={person.name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-veridian-100 dark:bg-veridian-900/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-veridian-700 dark:text-veridian-400">
                    {person.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gastus-text-secondary truncate">
                  {person.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium text-gray-900 dark:text-gastus-text">
                  {formatBRL(person.total)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gastus-text-secondary w-8 text-right">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
