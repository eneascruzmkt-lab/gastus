"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function CsvImportExport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: number[] } | null>(null);
  const [importError, setImportError] = useState("");

  function handleExport() {
    window.location.href = "/api/csv/exportar";
  }

  async function handleImport() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);
    setImportError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/csv/importar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setImportError(data.error || "Erro ao importar arquivo.");
        return;
      }

      setResult(data);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setImportError("Erro inesperado ao importar.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-5">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        Importar / Exportar CSV
      </h2>

      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Exporte todos os seus gastos em formato CSV.
        </p>
        <Button type="button" onClick={handleExport}>
          Exportar CSV
        </Button>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 pt-5 space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Importe gastos a partir de um arquivo CSV. Colunas esperadas:{" "}
          <span className="font-mono text-xs">tipo, nome, valor, categoria, dia_vencimento</span>
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="block text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 dark:file:bg-gray-800 dark:file:text-gray-300 file:cursor-pointer"
        />

        <Button type="button" onClick={handleImport} disabled={importing}>
          {importing ? "Importando..." : "Importar CSV"}
        </Button>

        {importError && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{importError}</p>
        )}

        {result && (
          <div className="text-sm space-y-1">
            <p className="font-medium text-veridian-600 dark:text-veridian-400">
              {result.imported} {result.imported === 1 ? "gasto importado" : "gastos importados"}
            </p>
            {result.errors.length > 0 && (
              <p className="text-gray-500 dark:text-gray-400">
                Erros nas linhas: {result.errors.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
