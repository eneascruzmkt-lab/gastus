"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface Category {
  id: string;
  name: string;
  predefined: boolean;
  userId: string | null;
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categorias");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function openCreate() {
    setEditingCategory(null);
    setName("");
    setModalOpen(true);
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setName(category.name);
    setModalOpen(true);
  }

  function openDelete(category: Category) {
    setDeletingCategory(category);
    setDeleteModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (editingCategory) {
        await fetch(`/api/categorias/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
      } else {
        await fetch("/api/categorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
      }
      setModalOpen(false);
      setName("");
      setEditingCategory(null);
      await fetchCategories();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingCategory || submitting) return;

    setSubmitting(true);
    try {
      await fetch(`/api/categorias/${deletingCategory.id}`, {
        method: "DELETE",
      });
      setDeleteModalOpen(false);
      setDeletingCategory(null);
      await fetchCategories();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Categorias
        </h1>
        <Button onClick={openCreate}>Nova categoria</Button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          Nenhuma categoria encontrada.
        </p>
      ) : (
        <div className="grid gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {category.name}
                </span>
                {category.predefined && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-veridian-100 dark:bg-veridian-900/30 text-veridian-700 dark:text-veridian-400 font-medium">
                    Padrão
                  </span>
                )}
              </div>

              {!category.predefined && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(category)}
                    className="p-2 rounded-lg text-gray-500 hover:text-veridian-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Editar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openDelete(category)}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Excluir"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? "Editar categoria" : "Nova categoria"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da categoria"
            autoFocus
            required
          />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir categoria"
      >
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Tem certeza que deseja excluir a categoria{" "}
          <strong>{deletingCategory?.name}</strong>? As despesas vinculadas
          serão movidas para "Outros".
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
