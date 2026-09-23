"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { SummaryCards } from "@/components/summary-cards";
import { ExpenseList } from "@/components/expense-list";
import { EvolutionChart } from "@/components/evolution-chart";
import { FreedomAlert } from "@/components/freedom-alert";

interface DashboardItem {
  id: string;
  name: string;
  value: number;
  dueDay: number;
  category: { id: string; name: string };
  status: "pendente" | "pago" | "atrasado";
}

interface DashboardData {
  refMonth: string;
  items: DashboardItem[];
  summary: { totalToPay: number; totalPaid: number; dueCount: number };
  projection: { month: string; total: number }[];
  freedomAlerts: { name: string; freedValue: number }[];
  selfDebtTotal: number;
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatRefMonth(refMonth: string): string {
  const [year, month] = refMonth.split("-").map(Number);
  return `${monthNames[month - 1]} ${year}`;
}

export default function DashboardPage() {
  const { data, isLoading: loading, mutate } = useSWR<DashboardData>("/api/dashboard", fetcher);

  async function handlePay(expenseId: string, value: number) {
    const res = await fetch("/api/pagamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expenseId, value }),
    });

    if (res.ok) {
      await mutate();
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Erro ao carregar dados.
        </p>
      </div>
    );
  }

  // Extract unique categories from items
  const categoriesMap = new Map<string, { id: string; name: string }>();
  for (const item of data.items) {
    categoriesMap.set(item.category.id, item.category);
  }
  const categories = Array.from(categoriesMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Fatura de {formatRefMonth(data.refMonth)}
        </p>
      </div>

      <FreedomAlert freedomAlerts={data.freedomAlerts} />

      <SummaryCards
        totalToPay={data.summary.totalToPay}
        totalPaid={data.summary.totalPaid}
        dueCount={data.summary.dueCount}
        selfDebtTotal={data.selfDebtTotal}
      />

      <ExpenseList
        items={data.items}
        categories={categories}
        onPay={handlePay}
      />

      <EvolutionChart projection={data.projection} />
    </div>
  );
}
