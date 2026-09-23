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
  dueMonth?: number | null;
  repeatsYearly?: boolean;
  active: boolean;
  category?: Category | null;
}

const monthOptions = [
  { value: "", label: "Selecione o mês" },
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export default function FixosPage() {
  const { data: expenses = [], isLoading: loadingExp, mutate: mutateExp } = useSWR<Expense[]>("/api/gastos?type=ONE_TIME", fetcher);
  const { data: categories = [], isLoading: loadingCats } = useSWR<Category[]>("/api/categorias", fetcher);
  const loading = loadingExp || loadingCats;
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [dueMonth, setDueMonth] = useState("");
  const [repeatsYearly, setRepeatsYearly] = useState(false);
  const [categoryId, setCategoryId] = useState("");

  function resetForm() {
    setName("");
    setTotalValue("");
    setDueDay("");
    setDueMonth("");
    setRepeatsYearly(false);
    setCategoryId("");
  }

  function openEdit(expense: Expense) {
    setSelectedExpense(expense);
    setName(expense.name);
    setTotalValue(String(expense.totalValue));
    setDueDay(String(expense.dueDay));
    setDueMonth(expense.dueMonth ? String(expense.dueMonth) : "");
    setRepeatsYearly(expense.repeatsYearly ?? false);
    setCategoryId(expense.category?.id ?? "");
    setEditModalOpen(true);
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
          type: "ONE_TIME",
          name: name.trim(),
          totalValue: Number(totalValue),
          dueDay: Number(dueDay),
          dueMonth: dueMonth ? Number(dueMonth) : null,
          repeatsYearly,
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

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExpense || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/gastos/${selectedExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          totalValue: Number(totalValue),
          dueDay: Number(dueDay),
          dueMonth: dueMonth ? Number(dueMonth) : null,
          repeatsYearly,
          categoryId,
        }),
      });
      setEditModalOpen(false);
      setSelectedExpense(null);
      resetForm();
      await mutateExp();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedExpense || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/gastos/${selectedExpense.id}`, {
        method: "DELETE",
      });
      setDeleteModalOpen(false);
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

  function renderForm(onSubmit: (e: React.FormEvent) => void, submitLabel: string) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: IPVA"
          required
        />
        <Input
          label="Valor"
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
          label="Mês do vencimento"
          options={monthOptions}
          value={dueMonth}
          onChange={(e) => setDueMonth(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <input
            id="repeatsYearly"
            type="checkbox"
            checked={repeatsYearly}
            onChange={(e) => setRepeatsYearly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-veridian-500 focus:ring-veridian-500"
          />
          <label
            htmlFor="repeatsYearly"
            className="text-sm font-medium text-gray-700 dark:text-gastus-text-secondary"
          >
            Repete todo ano
          </label>
        </div>
        <Select
          label="Categoria"
          options={categoryOptions}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        />
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setModalOpen(false);
              setEditModalOpen(false);
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : submitLabel}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gastus-text">
          Fixos Pontuais
        </h1>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          Novo fixo pontual
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gastus-text-secondary">Carregando...</p>
      ) : activeExpenses.length === 0 && inactiveExpenses.length === 0 ? (
        <p className="text-gray-500 dark:text-gastus-text-secondary">
          Nenhum gasto fixo pontual encontrado.
        </p>
      ) : (
        <div className="space-y-3">
          {activeExpenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense as any}>
              <button
                onClick={() => openEdit(expense)}
                className="p-2 rounded-lg text-gray-500 hover:text-veridian-600 hover:bg-gray-100 dark:hover:bg-gastus-card-elevated transition-colors"
                title="Editar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setSelectedExpense(expense);
                  setDeleteModalOpen(true);
                }}
                className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gastus-card-elevated transition-colors"
                title="Excluir"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              </button>
            </ExpenseCard>
          ))}

          {inactiveExpenses.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-500 dark:text-gastus-text-secondary mt-8 mb-2">
                Pagos
              </h2>
              {inactiveExpenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense as any}>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gastus-text-secondary font-medium">
                    Pago
                  </span>
                </ExpenseCard>
              ))}
            </>
          )}
        </div>
      )}

      {/* Modal: Novo fixo pontual */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo fixo pontual">
        {renderForm(handleCreate, "Salvar")}
      </Modal>

      {/* Modal: Editar fixo pontual */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar fixo pontual"
      >
        {renderForm(handleEdit, "Salvar")}
      </Modal>

      {/* Modal: Excluir */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir fixo pontual"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gastus-text-secondary">
            Tem certeza que deseja excluir{" "}
            <strong>{selectedExpense?.name}</strong>? Essa ação não pode ser
            desfeita.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={submitting}>
              {submitting ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
