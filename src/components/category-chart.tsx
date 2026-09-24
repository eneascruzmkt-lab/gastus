"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface CategoryChartProps {
  items: { value: number; category: { name: string } }[];
}

const COLORS = [
  "#40826D", "#5B9BD5", "#E67E22", "#9B59B6",
  "#E74C3C", "#1ABC9C", "#F39C12", "#3498DB",
  "#2ECC71", "#E91E63",
];

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function CategoryChart({ items }: CategoryChartProps) {
  if (items.length === 0) return null;

  const categoryTotals = new Map<string, number>();
  for (const item of items) {
    const current = categoryTotals.get(item.category.name) || 0;
    categoryTotals.set(item.category.name, current + item.value);
  }

  const data = Array.from(categoryTotals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-gastus-light-card dark:bg-gastus-card rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gastus-text mb-4">
        Gastos por categoria
      </h2>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-36 h-36 sm:w-48 sm:h-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatBRL(Number(value) || 0)}
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#F9FAFB",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2 w-full">
          {data.map((entry, i) => {
            const pct = ((entry.value / total) * 100).toFixed(0);
            return (
              <div key={entry.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gastus-text-secondary truncate">
                    {entry.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-gastus-text">
                    {formatBRL(entry.value)}
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
    </div>
  );
}
