"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { ExpenseCard } from "@/components/expense-card";

interface Category {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  name: string;
  type: string;
  totalValue: number;
  dueDay: number;
  active: boolean;
  category?: Category | null;
}

export default function RecorrentesPage() {
  const { data: expenses = [], isLoading: loadingExp, mutate: mutateExp } = useSWR<Expense[]>("/api/gastos?type=RECURRING", fetcher);
  const { data: categories = [], isLoading: loadingCats } = useSWR<Category[]>("/api/categorias", fetcher);
  const loading = loadingExp || loadingCats;
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [categoryId, setCategoryId] = useState("");

  function resetForm() {
    setName("");
    setTotalValue("");
    setDueDay("");
    setCategoryId("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RECURRING",
          name: name.trim(),
          totalValue: Number(totalValue),
          dueDay: Number(dueDay),
          categoryId,
        }),
      });
      setModalOpen(false);
      resetForm();
      await mutateExp();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!selectedExpense || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/gastos/${selectedExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      setCancelModalOpen(false);
      setSelectedExpense(null);
      await mutateExp();
    } finally {
      setSubmitting(false);
    }
  }

  const activeExpenses = expenses.filter((e) => e.active);
  const inactiveExpenses = expenses.filter((e) => !e.active);

  const categoryOptions = [
    { value: "", label: "Selecione uma categoria" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gastus-text">
          Recorrentes
        </h1>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          Novo recorrente
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gastus-text-secondary">Carregando...</p>
      ) : activeExpenses.length === 0 && inactiveExpenses.length === 0 ? (
        <p className="text-gray-500 dark:text-gastus-text-secondary">
          Nenhum gasto recorrente encontrado.
        </p>
      ) : (
        <div className="space-y-3">
          {activeExpenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense as any}>
              <button
                onClick={() => {
                  setSelectedExpense(expense);
                  setCancelModalOpen(true);
                }}
                className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gastus-card-elevated transition-colors"
                title="Cancelar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" x2="9" y1="9" y2="15" />
                  <line x1="9" x2="15" y1="9" y2="15" />
                </svg>
              </button>
            </ExpenseCard>
          ))}

          {inactiveExpenses.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-500 dark:text-gastus-text-secondary mt-8 mb-2">
                Cancelados
              </h2>
              {inactiveExpenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense as any}>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                    Cancelado
                  </span>
                </ExpenseCard>
              ))}
            </>
          )}
        </div>
      )}

      {/* Modal: Novo recorrente */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo recorrente">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Netflix"
            required
          />
          <Input
            label="Valor mensal"
            type="number"
            step="0.01"
            min="0.01"
            value={totalValue}
            onChange={(e) => setTotalValue(e.target.value)}
            required
          />
          <Input
            label="Dia do vencimento"
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            required
          />
          <Select
            label="Categoria"
            options={categoryOptions}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Cancelar recorrente */}
      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancelar recorrente"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gastus-text-secondary">
            Tem certeza que deseja cancelar{" "}
            <strong>{selectedExpense?.name}</strong>? O gasto não será mais
            contabilizado nos próximos meses.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
              Voltar
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={submitting}>
              {submitting ? "Cancelando..." : "Cancelar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
