"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface ExpenseItem {
  id: string;
  name: string;
  value: number;
  dueDay: number;
  category: { id: string; name: string };
  status: "pendente" | "pago" | "atrasado";
}

interface ExpenseListProps {
  items: ExpenseItem[];
  categories: { id: string; name: string }[];
  onPay: (expenseId: string, value: number) => void;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const statusConfig = {
  pago: {
    label: "Pago",
    classes: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  },
  pendente: {
    label: "Pendente",
    classes: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  },
  atrasado: {
    label: "Atrasado",
    classes: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  },
};

export function ExpenseList({ items, categories, onPay }: ExpenseListProps) {
  const [categoryFilter, setCategoryFilter] = useState("");

  const filtered = categoryFilter
    ? items.filter((i) => i.category.id === categoryFilter)
    : items;

  const filterOptions = [
    { value: "", label: "Todas as categorias" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Select
          label="Filtrar por categoria"
          options={filterOptions}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum gasto encontrado.
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((item) => {
            const badge = statusConfig[item.status];
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {item.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {item.category.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>{formatBRL(item.value)}</span>
                    <span>Dia {item.dueDay}</span>
                  </div>
                </div>

                {item.status !== "pago" && (
                  <Button
                    onClick={() => onPay(item.id, item.value)}
                    className="ml-4 text-sm whitespace-nowrap"
                  >
                    Marcar como pago
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
