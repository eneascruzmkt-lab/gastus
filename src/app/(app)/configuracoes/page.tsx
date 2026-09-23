"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDarkMode } from "@/components/providers";
import { CsvImportExport } from "@/components/csv-import-export";

export default function ConfiguracoesPage() {
  const [ntfyTopic, setNtfyTopic] = useState("");
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const { dark, toggle } = useDarkMode();

  useEffect(() => {
    fetch("/api/configuracoes")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setNtfyTopic(data.ntfyTopic || "");
          setNotifyDaysBefore(data.notifyDaysBefore ?? 3);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setSuccessMsg("");

    try {
      const res = await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ntfyTopic: ntfyTopic.trim(),
          notifyDaysBefore,
          darkMode: dark,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Configurações salvas com sucesso!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto">
        <p className="text-gray-500 dark:text-gastus-text-secondary">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gastus-text mb-6">
        Configurações
      </h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 rounded-xl bg-gastus-light-card dark:bg-gastus-card border border-gastus-light-border dark:border-gastus-border space-y-5">
          <Input
            label="Tópico Ntfy"
            value={ntfyTopic}
            onChange={(e) => setNtfyTopic(e.target.value)}
            placeholder="Ex: meu-topico-gastus"
          />

          <Input
            label="Dias de antecedência"
            type="number"
            min={1}
            max={30}
            value={notifyDaysBefore}
            onChange={(e) => setNotifyDaysBefore(Number(e.target.value))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gastus-text-secondary mb-2">
              Modo escuro
            </label>
            <button
              type="button"
              onClick={toggle}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                dark
                  ? "bg-veridian-500"
                  : "bg-gray-300 dark:bg-gray-700"
              }`}
              aria-label="Alternar modo escuro"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  dark ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {successMsg && (
          <p className="text-sm font-medium text-veridian-600 dark:text-veridian-400">
            {successMsg}
          </p>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </form>

      <hr className="border-gastus-light-border dark:border-gastus-border my-8" />

      <CsvImportExport />
    </div>
  );
}
