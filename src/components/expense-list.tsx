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
    classes: "bg-status-success/10 text-status-success",
  },
  pendente: {
    label: "Pendente",
    classes: "bg-status-pending/10 text-status-pending",
  },
  atrasado: {
    label: "Atrasado",
    classes: "bg-status-danger/10 text-status-danger",
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
        <p className="text-gray-500 dark:text-gastus-text-secondary">
          Nenhum gasto encontrado.
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((item) => {
            const badge = statusConfig[item.status];
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gastus-light-card dark:bg-gastus-card border border-gastus-light-border dark:border-gastus-border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-gastus-text">
                      {item.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gastus-card-elevated text-gastus-light-text-secondary dark:text-gastus-text-secondary">
                      {item.category.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gastus-text-secondary">
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
