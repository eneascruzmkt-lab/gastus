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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [adiantarModalOpen, setAdiantarModalOpen] = useState(false);
  const [adiarModalOpen, setAdiarModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editDueDay, setEditDueDay] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editTotalInstallments, setEditTotalInstallments] = useState("");
  const [editCurrentInstallment, setEditCurrentInstallment] = useState("");

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
      // A fatura que você vê hoje é a do mês que vem
      // Ex: em setembro, a fatura mostra outubro
      // Se está na parcela 2 de 6, a parcela 2 é de outubro
      // Então a parcela 1 foi em setembro, e o início é setembro
      // startDate = próximo mês - (parcela atual - 1)
      const paidCount = Number(currentInstallment) - 1;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() + 1 - paidCount);
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

  function openEdit(expense: Expense) {
    setSelectedExpense(expense);
    setEditName(expense.name);
    setEditDueDay(String(expense.dueDay));
    setEditCategoryId(expense.category?.id || "");
    setEditTotalInstallments(String(expense.totalInstallments || ""));
    // Parcela atual = total - restantes + 1
    const current = (expense.totalInstallments || 0) - (expense.remainingInstallments || 0) + 1;
    setEditCurrentInstallment(String(current));
    setEditModalOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExpense || submitting) return;
    setSubmitting(true);
    try {
      const newTotal = Number(editTotalInstallments);
      const newCurrent = Number(editCurrentInstallment);
      const oldTotal = selectedExpense.totalInstallments || 0;
      const oldCurrent = oldTotal - (selectedExpense.remainingInstallments || 0) + 1;
      const parcelasChanged = newTotal !== oldTotal || newCurrent !== oldCurrent;

      const body: any = {
        name: editName.trim(),
        dueDay: Number(editDueDay),
        categoryId: editCategoryId,
      };

      // Só recalcula parcelas se o usuário realmente mudou os valores
      if (parcelasChanged) {
        const newRemaining = newTotal - newCurrent + 1;
        const installmentVal = selectedExpense.installmentValue || 0;
        const paidCount = newCurrent - 1;
        const newStartDate = new Date();
        newStartDate.setMonth(newStartDate.getMonth() + 1 - paidCount);
        newStartDate.setDate(1);

        body.totalInstallments = newTotal;
        body.remainingInstallments = newRemaining;
        body.totalValue = installmentVal * newTotal;
        body.startDate = newStartDate.toISOString();
      }

      await fetch(`/api/gastos/${selectedExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setEditModalOpen(false);
      setSelectedExpense(null);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gastus-text">
          Parcelas
        </h1>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          Nova parcela
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gastus-text-secondary">Carregando...</p>
      ) : activeExpenses.length === 0 && inactiveExpenses.length === 0 ? (
        <p className="text-gray-500 dark:text-gastus-text-secondary">
          Nenhuma parcela encontrada.
        </p>
      ) : (
        <div className="space-y-3">
          {activeExpenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense as any}>
              <button
                onClick={() => openEdit(expense)}
                className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gastus-card-elevated transition-colors"
                title="Editar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setSelectedExpense(expense);
                  setAdiantarQty("1");
                  setAdiantarModalOpen(true);
                }}
                className="p-2 rounded-lg text-gray-500 hover:text-veridian-600 hover:bg-gray-100 dark:hover:bg-gastus-card-elevated transition-colors"
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
                className="p-2 rounded-lg text-gray-500 hover:text-yellow-600 hover:bg-gray-100 dark:hover:bg-gastus-card-elevated transition-colors"
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
                Finalizadas
              </h2>
              {inactiveExpenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense as any}>
                  <button
                    onClick={async () => {
                      await fetch(`/api/gastos/${expense.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ active: true, remainingInstallments: 1 }),
                      });
                      await mutateExp();
                    }}
                    className="text-xs px-3 py-1 rounded-lg bg-veridian-500 text-white hover:bg-veridian-hover transition-colors"
                    title="Reativar com 1 parcela restante"
                  >
                    Reativar
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
                    </svg>
                  </button>
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
              <p className="text-gray-500 dark:text-gastus-text-secondary">
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

      {/* Modal: Editar */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar parcela">
        <form onSubmit={handleEdit} className="space-y-4">
          {selectedExpense && (
            <p className="text-sm text-gray-500 dark:text-gastus-text-secondary">
              Editando: {selectedExpense.name} ({selectedExpense.installmentValue?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês, {selectedExpense.remainingInstallments} restante(s))
            </p>
          )}
          <Input
            label="Nome"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Parcela atual"
              type="number"
              min="1"
              max={editTotalInstallments || undefined}
              value={editCurrentInstallment}
              onChange={(e) => setEditCurrentInstallment(e.target.value)}
              required
            />
            <Input
              label="Total de parcelas"
              type="number"
              min="1"
              value={editTotalInstallments}
              onChange={(e) => setEditTotalInstallments(e.target.value)}
              required
            />
          </div>
          <Input
            label="Dia do vencimento"
            type="number"
            min="1"
            max="31"
            value={editDueDay}
            onChange={(e) => setEditDueDay(e.target.value)}
            required
          />
          <Select
            label="Categoria"
            options={categoryOptions}
            value={editCategoryId}
            onChange={(e) => setEditCategoryId(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>
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
          <p className="text-gray-700 dark:text-gastus-text-secondary">
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
          <p className="text-gray-700 dark:text-gastus-text-secondary">
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
