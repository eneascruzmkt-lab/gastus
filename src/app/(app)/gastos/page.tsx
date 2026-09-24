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

interface Person {
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
  recurringInterval?: number;
  active: boolean;
  category?: Category | null;
  person?: Person | null;
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

const typeOptions = [
  { value: "RECURRING", label: "Recorrente" },
  { value: "ONE_TIME", label: "Fixo Pontual" },
];

export default function GastosPage() {
  const { data: recurringExp = [], isLoading: loadingRec, mutate: mutateRec } = useSWR<Expense[]>("/api/gastos?type=RECURRING", fetcher);
  const { data: oneTimeExp = [], isLoading: loadingOT, mutate: mutateOT } = useSWR<Expense[]>("/api/gastos?type=ONE_TIME", fetcher);
  const { data: categories = [], isLoading: loadingCats } = useSWR<Category[]>("/api/categorias", fetcher);
  const { data: persons = [], isLoading: loadingPersons } = useSWR<Person[]>("/api/pessoas", fetcher);
  const loading = loadingRec || loadingOT || loadingCats || loadingPersons;

  const expenses = [...recurringExp, ...oneTimeExp];

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filtros
  const [filterType, setFilterType] = useState("");
  const [filterPerson, setFilterPerson] = useState("");

  // Form fields
  const [type, setType] = useState("RECURRING");
  const [name, setName] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [dueMonth, setDueMonth] = useState("");
  const [repeatsYearly, setRepeatsYearly] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [personId, setPersonId] = useState("");
  const [recurringInterval, setRecurringInterval] = useState("1");

  // Person form
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonIncome, setNewPersonIncome] = useState("");

  function resetForm() {
    setType("RECURRING");
    setName("");
    setTotalValue("");
    setDueDay("");
    setDueMonth("");
    setRepeatsYearly(false);
    setCategoryId("");
    setPersonId("");
    setRecurringInterval("1");
  }

  function openEdit(expense: Expense) {
    setSelectedExpense(expense);
    setType(expense.type);
    setName(expense.name);
    setTotalValue(String(expense.totalValue));
    setDueDay(String(expense.dueDay));
    setDueMonth(expense.dueMonth ? String(expense.dueMonth) : "");
    setRepeatsYearly(expense.repeatsYearly ?? false);
    setRecurringInterval(String(expense.recurringInterval ?? 1));
    setCategoryId(expense.category?.id ?? "");
    setPersonId(expense.person?.id ?? "");
    setEditModalOpen(true);
  }

  async function mutateAll() {
    await Promise.all([mutateRec(), mutateOT()]);
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
          type,
          name: name.trim(),
          totalValue: Number(totalValue),
          dueDay: dueDay ? Number(dueDay) : 0,
          dueMonth: type === "ONE_TIME" && dueMonth ? Number(dueMonth) : null,
          repeatsYearly: type === "ONE_TIME" ? repeatsYearly : false,
          recurringInterval: type === "RECURRING" ? Number(recurringInterval) : 1,
          categoryId,
          personId: personId || null,
        }),
      });
      setModalOpen(false);
      resetForm();
      await mutateAll();
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
          dueDay: dueDay ? Number(dueDay) : 0,
          dueMonth: type === "ONE_TIME" && dueMonth ? Number(dueMonth) : null,
          repeatsYearly: type === "ONE_TIME" ? repeatsYearly : false,
          recurringInterval: type === "RECURRING" ? Number(recurringInterval) : 1,
          categoryId,
          personId: personId || null,
        }),
      });
      setEditModalOpen(false);
      setSelectedExpense(null);
      resetForm();
      await mutateAll();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate() {
    if (!selectedExpense || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/gastos/${selectedExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      setDeleteModalOpen(false);
      setSelectedExpense(null);
      await mutateAll();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddPerson(e: React.FormEvent) {
    e.preventDefault();
    if (!newPersonName.trim() || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/pessoas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPersonName.trim(), income: Number(newPersonIncome) || 0 }),
      });
      setNewPersonName("");
      setNewPersonIncome("");
      setPersonModalOpen(false);
      window.location.reload();
    } finally {
      setSubmitting(false);
    }
  }

  // Filtrar
  let filtered = expenses;
  if (filterType) filtered = filtered.filter((e) => e.type === filterType);
  if (filterPerson) filtered = filtered.filter((e) => e.person?.id === filterPerson);

  const activeExpenses = filtered.filter((e) => e.active);
  const inactiveExpenses = filtered.filter((e) => !e.active);

  const categoryOptions = [
    { value: "", label: "Selecione uma categoria" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const personOptions = [
    { value: "", label: "Sem pessoa" },
    ...persons.map((p) => ({ value: p.id, label: p.name })),
  ];

  const filterTypeOptions = [
    { value: "", label: "Todos os tipos" },
    ...typeOptions,
  ];

  const filterPersonOptions = [
    { value: "", label: "Todas as pessoas" },
    ...persons.map((p) => ({ value: p.id, label: p.name })),
  ];

  const typeBadge = (t: string) =>
    t === "RECURRING"
      ? { label: "Recorrente", classes: "bg-veridian-100 dark:bg-veridian-900/30 text-veridian-700 dark:text-veridian-400" }
      : { label: "Fixo", classes: "bg-status-info/10 text-status-info" };

  function renderForm(onSubmit: (e: React.FormEvent) => void, submitLabel: string, isEdit = false) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        {!isEdit && (
          <Select
            label="Tipo"
            options={typeOptions}
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          />
        )}
        <Input
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === "RECURRING" ? "Ex: Netflix" : "Ex: IPVA"}
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
          placeholder="Opcional"
        />
        {type === "RECURRING" && (
          <Select
            label="Frequência"
            options={[
              { value: "1", label: "Todo mês" },
              { value: "2", label: "A cada 2 meses" },
              { value: "3", label: "A cada 3 meses" },
              { value: "6", label: "A cada 6 meses" },
              { value: "12", label: "Uma vez por ano" },
            ]}
            value={recurringInterval}
            onChange={(e) => setRecurringInterval(e.target.value)}
          />
        )}
        {type === "ONE_TIME" && (
          <>
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
          </>
        )}
        <Select
          label="Categoria"
          options={categoryOptions}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        />
        <div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Select
                label="Pessoa"
                options={personOptions}
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setPersonModalOpen(true)}
              className="mb-[2px] p-2.5 rounded-lg text-veridian-500 hover:bg-veridian-50 dark:hover:bg-veridian-950 transition-colors"
              title="Adicionar pessoa"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" x2="19" y1="8" y2="14" />
                <line x1="22" x2="16" y1="11" y2="11" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => { setModalOpen(false); setEditModalOpen(false); }}
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gastus-text">
          Gastos
        </h1>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          Novo gasto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <div className="max-w-[200px]">
          <Select
            label="Tipo"
            options={filterTypeOptions}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          />
        </div>
        <div className="max-w-[200px]">
          <Select
            label="Pessoa"
            options={filterPersonOptions}
            value={filterPerson}
            onChange={(e) => setFilterPerson(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gastus-text-secondary">Carregando...</p>
      ) : activeExpenses.length === 0 && inactiveExpenses.length === 0 ? (
        <p className="text-gray-500 dark:text-gastus-text-secondary">
          Nenhum gasto encontrado.
        </p>
      ) : (
        <div className="space-y-3">
          {activeExpenses.map((expense) => {
            const badge = typeBadge(expense.type);
            return (
              <div key={expense.id} className="relative">
                <ExpenseCard expense={expense as any}>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.classes}`}>
                      {badge.label}
                    </span>
                    {expense.type === "RECURRING" && (expense.recurringInterval ?? 1) > 1 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-status-pending/10 text-status-pending font-medium">
                        A cada {expense.recurringInterval} meses
                      </span>
                    )}
                    {expense.person && expense.person.name !== "Eu" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gastus-card-elevated text-gray-600 dark:text-gastus-text-secondary font-medium">
                        {expense.person.name}
                      </span>
                    )}
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
                      title={expense.type === "RECURRING" ? "Cancelar" : "Excluir"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" x2="9" y1="9" y2="15" />
                        <line x1="9" x2="15" y1="9" y2="15" />
                      </svg>
                    </button>
                  </div>
                </ExpenseCard>
              </div>
            );
          })}

          {inactiveExpenses.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-500 dark:text-gastus-text-secondary mt-8 mb-2">
                Inativos
              </h2>
              {inactiveExpenses.map((expense) => {
                const badge = typeBadge(expense.type);
                return (
                  <ExpenseCard key={expense.id} expense={expense as any}>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </ExpenseCard>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Modal: Novo gasto */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo gasto">
        {renderForm(handleCreate, "Salvar")}
      </Modal>

      {/* Modal: Editar gasto */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar gasto">
        {renderForm(handleEdit, "Salvar", true)}
      </Modal>

      {/* Modal: Cancelar/Excluir */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={selectedExpense?.type === "RECURRING" ? "Cancelar gasto" : "Excluir gasto"}
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gastus-text-secondary">
            Tem certeza que deseja {selectedExpense?.type === "RECURRING" ? "cancelar" : "excluir"}{" "}
            <strong>{selectedExpense?.name}</strong>?
            {selectedExpense?.type === "RECURRING"
              ? " O gasto não será mais contabilizado nos próximos meses."
              : " Essa ação não pode ser desfeita."}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="danger"
              onClick={
                selectedExpense?.type === "RECURRING"
                  ? handleDeactivate
                  : async () => {
                      if (!selectedExpense || submitting) return;
                      setSubmitting(true);
                      try {
                        await fetch(`/api/gastos/${selectedExpense.id}`, { method: "DELETE" });
                        setDeleteModalOpen(false);
                        setSelectedExpense(null);
                        await mutateAll();
                      } finally {
                        setSubmitting(false);
                      }
                    }
              }
              disabled={submitting}
            >
              {submitting
                ? selectedExpense?.type === "RECURRING" ? "Cancelando..." : "Excluindo..."
                : selectedExpense?.type === "RECURRING" ? "Cancelar" : "Excluir"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Nova pessoa */}
      <Modal open={personModalOpen} onClose={() => setPersonModalOpen(false)} title="Nova pessoa">
        <form onSubmit={handleAddPerson} className="space-y-4">
          <Input
            label="Nome"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            placeholder="Ex: Esposa"
            required
          />
          <Input
            label="Renda mensal"
            type="number"
            step="0.01"
            min="0"
            value={newPersonIncome}
            onChange={(e) => setNewPersonIncome(e.target.value)}
            placeholder="Ex: 3000"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setPersonModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
