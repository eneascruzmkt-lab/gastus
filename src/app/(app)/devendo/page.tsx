"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
}

interface Payment {
  id: string;
  value: number;
  paymentDate: string;
  referenceMonth: string;
}

interface Debt {
  id: string;
  name: string;
  note: string | null;
  totalValue: number;
  active: boolean;
  category: Category | null;
  payments: Payment[];
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function currentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function DevendoPage() {
  const { data: debts = [], isLoading: loadingDebts, mutate: mutateDebts } = useSWR<Debt[]>("/api/gastos?type=SELF_DEBT", fetcher);
  const { data: categories = [], isLoading: loadingCats } = useSWR<Category[]>("/api/categorias", fetcher);
  const loading = loadingDebts || loadingCats;
  const [submitting, setSubmitting] = useState(false);

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");

  // Repor modal
  const [reporModalOpen, setReporModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [reporValue, setReporValue] = useState("");

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);

  function resetCreateForm() {
    setName("");
    setTotalValue("");
    setCategoryId("");
    setNote("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !categoryId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SELF_DEBT",
          name: name.trim(),
          totalValue: Number(totalValue),
          categoryId,
          dueDay: 0,
          note: note.trim() || null,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          alert(data.error || "Erro ao criar dívida");
        } catch {
          alert("Erro ao criar dívida: " + text);
        }
        return;
      }
      setCreateModalOpen(false);
      resetCreateForm();
      await mutateDebts();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRepor(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDebt || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/pagamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseId: selectedDebt.id,
          value: Number(reporValue),
          referenceMonth: currentMonth(),
        }),
      });
      setReporModalOpen(false);
      setSelectedDebt(null);
      setReporValue("");
      await mutateDebts();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/gastos/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      await mutateDebts();
    } finally {
      setSubmitting(false);
    }
  }

  function openRepor(debt: Debt) {
    setSelectedDebt(debt);
    setReporValue("");
    setReporModalOpen(true);
  }

  const activeDebts = debts.filter((d) => d.active);
  const inactiveDebts = debts.filter((d) => !d.active);

  const categoryOptions = [
    { value: "", label: "Selecione uma categoria" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  function getDebtInfo(debt: Debt) {
    const totalPaid = debt.payments.reduce((sum, p) => sum + p.value, 0);
    const remaining = debt.totalValue - totalPaid;
    const progress = debt.totalValue > 0 ? (totalPaid / debt.totalValue) * 100 : 0;
    return { totalPaid, remaining, progress };
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Devendo
        </h1>
        <Button onClick={() => { resetCreateForm(); setCreateModalOpen(true); }}>
          Nova dívida
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      ) : activeDebts.length === 0 && inactiveDebts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          Nenhuma dívida encontrada.
        </p>
      ) : (
        <div className="space-y-3">
          {activeDebts.map((debt) => {
            const { totalPaid, remaining, progress } = getDebtInfo(debt);
            return (
              <div
                key={debt.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {debt.name}
                    </h3>
                    {debt.note && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {debt.note}
                      </p>
                    )}
                    {debt.category && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {debt.category.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="primary"
                      className="text-sm px-3 py-1.5"
                      onClick={() => openRepor(debt)}
                    >
                      Repor
                    </Button>
                    <button
                      onClick={() => {
                        setDeleteTarget(debt);
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
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Valor original</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatBRL(debt.totalValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Já reposto</p>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      {formatBRL(totalPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Falta</p>
                    <p className="font-medium text-orange-600 dark:text-orange-400">
                      {formatBRL(remaining)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-veridian-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                  {progress.toFixed(0)}%
                </p>
              </div>
            );
          })}

          {inactiveDebts.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mt-8 mb-2">
                Quitados
              </h2>
              {inactiveDebts.map((debt) => {
                const { totalPaid } = getDebtInfo(debt);
                return (
                  <div
                    key={debt.id}
                    className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {debt.name}
                        </h3>
                        {debt.note && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {debt.note}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                          Quitado
                        </span>
                        <button
                          onClick={() => {
                            setDeleteTarget(debt);
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
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatBRL(totalPaid)} reposto de {formatBRL(debt.totalValue)}
                    </p>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Modal: Nova dívida */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Nova dívida">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Empréstimo para João"
            required
          />
          <Input
            label="Valor total"
            type="number"
            step="0.01"
            min="0.01"
            value={totalValue}
            onChange={(e) => setTotalValue(e.target.value)}
            required
          />
          <Select
            label="Categoria"
            options={categoryOptions}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          />
          <Input
            label="Observação"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opcional"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Repor */}
      <Modal open={reporModalOpen} onClose={() => setReporModalOpen(false)} title="Repor valor">
        <form onSubmit={handleRepor} className="space-y-4">
          {selectedDebt && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Falta {formatBRL(getDebtInfo(selectedDebt).remaining)} de {formatBRL(selectedDebt.totalValue)}
            </p>
          )}
          <Input
            label="Valor a repor"
            type="number"
            step="0.01"
            min="0.01"
            max={selectedDebt ? String(getDebtInfo(selectedDebt).remaining) : undefined}
            value={reporValue}
            onChange={(e) => setReporValue(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setReporModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Repondo..." : "Repor"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Excluir */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Excluir dívida">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Tem certeza que deseja excluir{" "}
            <strong>{deleteTarget?.name}</strong>? Essa ação não pode ser desfeita.
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
