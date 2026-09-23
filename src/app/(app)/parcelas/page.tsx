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
  installmentValue?: number | null;
  totalInstallments?: number | null;
  remainingInstallments?: number | null;
  startDate?: string | null;
  dueDay: number;
  active: boolean;
  category?: Category | null;
}

export default function ParcelasPage() {
  const { data: expenses = [], isLoading: loadingExp, mutate: mutateExp } = useSWR<Expense[]>("/api/gastos?type=INSTALLMENT", fetcher);
  const { data: categories = [], isLoading: loadingCats } = useSWR<Category[]>("/api/categorias", fetcher);
  const loading = loadingExp || loadingCats;
  const [modalOpen, setModalOpen] = useState(false);
  const [adiantarModalOpen, setAdiantarModalOpen] = useState(false);
  const [adiarModalOpen, setAdiarModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [installmentValueInput, setInstallmentValueInput] = useState("");
  const [currentInstallment, setCurrentInstallment] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [adiantarQty, setAdiantarQty] = useState("1");

  const totalValue =
    Number(installmentValueInput) && Number(totalInstallments)
      ? Number(installmentValueInput) * Number(totalInstallments)
      : 0;

  const remainingCalc =
    Number(totalInstallments) && Number(currentInstallment)
      ? Number(totalInstallments) - Number(currentInstallment) + 1
      : 0;

  function resetForm() {
    setName("");
    setInstallmentValueInput("");
    setCurrentInstallment("");
    setTotalInstallments("");
    setDueDay("");
    setCategoryId("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      // Calcular data de início baseado na parcela atual
      // Se está na parcela 2 de 6, já pagou 1, então começou 1 mês atrás
      const paidCount = Number(currentInstallment) - 1;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - paidCount);
      startDate.setDate(1);

      const res = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INSTALLMENT",
          name: name.trim(),
          totalValue,
          installmentValue: Number(installmentValueInput),
          totalInstallments: Number(totalInstallments),
          remainingInstallments: remainingCalc,
          startDate: startDate.toISOString(),
          dueDay: Number(dueDay),
          categoryId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        try { alert(JSON.parse(text).error); } catch { alert("Erro ao criar parcela"); }
        return;
      }

      // Registrar parcelas já pagas
      const expense = await res.json();
      for (let i = 0; i < paidCount; i++) {
        const payMonth = new Date(startDate);
        payMonth.setMonth(payMonth.getMonth() + i);
        const refMonth = `${payMonth.getFullYear()}-${String(payMonth.getMonth() + 1).padStart(2, "0")}`;
        await fetch("/api/pagamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expenseId: expense.id,
            value: Number(installmentValueInput),
            referenceMonth: refMonth,
          }),
        });
      }
      setModalOpen(false);
      resetForm();
      await mutateExp();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdiantar() {
    if (!selectedExpense || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/gastos/${selectedExpense.id}/adiantar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(adiantarQty) }),
      });
      setAdiantarModalOpen(false);
      setSelectedExpense(null);
      setAdiantarQty("1");
      await mutateExp();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdiar() {
    if (!selectedExpense || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/gastos/${selectedExpense.id}/adiar`, {
        method: "POST",
      });
      setAdiarModalOpen(false);
      setSelectedExpense(null);
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Parcelas
        </h1>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          Nova parcela
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      ) : activeExpenses.length === 0 && inactiveExpenses.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          Nenhuma parcela encontrada.
        </p>
      ) : (
        <div className="space-y-3">
          {activeExpenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense as any}>
              <button
                onClick={() => {
                  setSelectedExpense(expense);
                  setAdiantarQty("1");
                  setAdiantarModalOpen(true);
                }}
                className="p-2 rounded-lg text-gray-500 hover:text-veridian-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Adiantar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7" />
                  <polyline points="6 17 11 12 6 7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setSelectedExpense(expense);
                  setAdiarModalOpen(true);
                }}
                className="p-2 rounded-lg text-gray-500 hover:text-yellow-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Adiar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setSelectedExpense(expense);
                  setDeleteModalOpen(true);
                }}
                className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
              <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mt-8 mb-2">
                Finalizadas
              </h2>
              {inactiveExpenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense as any}>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                    Finalizada
                  </span>
                </ExpenseCard>
              ))}
            </>
          )}
        </div>
      )}

      {/* Modal: Nova parcela */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova parcela">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Celular"
            required
          />
          <Input
            label="Valor da parcela"
            type="number"
            step="0.01"
            min="0.01"
            value={installmentValueInput}
            onChange={(e) => setInstallmentValueInput(e.target.value)}
            placeholder="Ex: 290,74"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Parcela atual"
              type="number"
              min="1"
              max={totalInstallments || undefined}
              value={currentInstallment}
              onChange={(e) => setCurrentInstallment(e.target.value)}
              placeholder="Ex: 2"
              required
            />
            <Input
              label="Total de parcelas"
              type="number"
              min="1"
              value={totalInstallments}
              onChange={(e) => setTotalInstallments(e.target.value)}
              placeholder="Ex: 6"
              required
            />
          </div>
          {remainingCalc > 0 && totalValue > 0 && (
            <div className="text-sm space-y-1">
              <p className="text-veridian-600 dark:text-veridian-400 font-medium">
                Valor total: {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Faltam {remainingCalc} parcela(s) de {Number(totalInstallments)}
              </p>
            </div>
          )}
          <Input
            label="Dia do vencimento"
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            placeholder="Ex: 10"
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

      {/* Modal: Adiantar */}
      <Modal
        open={adiantarModalOpen}
        onClose={() => setAdiantarModalOpen(false)}
        title="Adiantar parcelas"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Quantas parcelas deseja adiantar de{" "}
            <strong>{selectedExpense?.name}</strong>?
          </p>
          <Input
            label="Quantidade"
            type="number"
            min="1"
            max={String(selectedExpense?.remainingInstallments ?? 1)}
            value={adiantarQty}
            onChange={(e) => setAdiantarQty(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAdiantarModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdiantar} disabled={submitting}>
              {submitting ? "Adiantando..." : "Adiantar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Adiar */}
      <Modal
        open={adiarModalOpen}
        onClose={() => setAdiarModalOpen(false)}
        title="Adiar parcela"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Tem certeza que deseja adiar a próxima parcela de{" "}
            <strong>{selectedExpense?.name}</strong> para o mês seguinte?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAdiarModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdiar} disabled={submitting}>
              {submitting ? "Adiando..." : "Adiar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Excluir */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir parcela"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
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
