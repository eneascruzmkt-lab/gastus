"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { SummaryCards } from "@/components/summary-cards";
import { ExpenseList } from "@/components/expense-list";
import { EvolutionChart } from "@/components/evolution-chart";
import { FreedomAlert } from "@/components/freedom-alert";
import { CategoryChart } from "@/components/category-chart";
import { PersonSummary } from "@/components/person-summary";
import { Button } from "@/components/ui/button";

interface DashboardItem {
  id: string;
  name: string;
  type: string;
  value: number;
  dueDay: number;
  category: { id: string; name: string };
  status: "pendente" | "pago" | "atrasado";
}

interface DashboardData {
  refMonth: string;
  items: DashboardItem[];
  summary: { totalToPay: number; totalPaid: number; dueCount: number; installmentTotal: number; fixedTotal: number };
  projection: { month: string; parcelas: number; byPerson: Record<string, number> }[];
  freedomAlerts: { name: string; freedValue: number }[];
  selfDebtTotal: number;
  totalDebt: number;
  perPerson: { name: string; total: number; income: number }[];
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gastus-text mb-6">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gastus-text-secondary">Carregando...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gastus-text mb-6">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gastus-text-secondary">
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gastus-text">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gastus-text-secondary">
          Fatura de {formatRefMonth(data.refMonth)}
        </p>
      </div>

      <FreedomAlert freedomAlerts={data.freedomAlerts} />

      <SummaryCards
        totalToPay={data.summary.totalToPay}
        installmentTotal={data.summary.installmentTotal}
        fixedTotal={data.summary.fixedTotal}
        totalPaid={data.summary.totalPaid}
        dueCount={data.summary.dueCount}
        selfDebtTotal={data.selfDebtTotal}
        totalDebt={data.totalDebt}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart items={data.items.filter((i) => i.type === "INSTALLMENT")} />
        <PersonSummary perPerson={data.perPerson} />
      </div>

      <EvolutionChart projection={data.projection} />

      <ExpenseList
        items={data.items.filter((i) => i.type === "INSTALLMENT")}
        categories={categories}
      />

      {data.items.filter((i) => i.type === "INSTALLMENT").some((i) => i.status !== "pago") && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gastus-text mb-3">
            Marcar como pago
          </h2>
          <div className="grid gap-3">
            {data.items
              .filter((i) => i.type === "INSTALLMENT" && i.status !== "pago")
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gastus-light-card dark:bg-gastus-card border border-gastus-light-border dark:border-gastus-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-medium text-gray-900 dark:text-gastus-text truncate">
                      {item.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gastus-text-secondary">
                      {item.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gastus-text-secondary">
                      Dia {item.dueDay}
                    </span>
                  </div>
                  <Button
                    onClick={() => handlePay(item.id, item.value)}
                    className="text-sm whitespace-nowrap shrink-0"
                  >
                    Pagar
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
