"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gastus-light-bg dark:bg-gastus-bg px-4">
      <div className="w-full max-w-md bg-gastus-light-card dark:bg-gastus-card rounded-2xl p-8 shadow-lg">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="Gastus" width={180} height={50} priority />
        </div>
        <h2 className="text-lg font-semibold text-center text-gray-700 dark:text-gray-300 mb-6">
          Criar conta
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-veridian-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-veridian-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-veridian-500 focus:border-transparent outline-none"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-veridian-500 text-white font-medium hover:bg-veridian-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gastus-light-text-secondary dark:text-gastus-text-secondary">
          Já tem conta?{" "}
          <Link href="/login" className="text-veridian-500 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
