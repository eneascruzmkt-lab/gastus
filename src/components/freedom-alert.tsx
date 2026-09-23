"use client";

interface FreedomAlertProps {
  freedomAlerts: { name: string; freedValue: number }[];
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function FreedomAlert({ freedomAlerts }: FreedomAlertProps) {
  if (freedomAlerts.length === 0) return null;

  return (
    <div className="bg-veridian-50 dark:bg-veridian-950 border border-veridian-200 dark:border-veridian-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-veridian-700 dark:text-veridian-300 mb-2">
        Parcela finalizada!
      </h3>
      <div className="space-y-1">
        {freedomAlerts.map((alert) => (
          <p
            key={alert.name}
            className="text-veridian-600 dark:text-veridian-400"
          >
            <strong>{alert.name}</strong> acabou! {formatBRL(alert.freedValue)}
            /mês a menos
          </p>
        ))}
      </div>
    </div>
  );
}
