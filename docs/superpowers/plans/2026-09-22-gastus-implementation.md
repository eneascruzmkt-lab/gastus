# Gastus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack expense tracker for fixed costs, installments, and recurring payments with dashboard, notifications, and dark mode.

**Architecture:** Next.js App Router full-stack app. API Routes handle all backend logic. Prisma ORM connects to Neon PostgreSQL. NextAuth.js with CredentialsProvider for auth (JWT sessions). Tailwind CSS for styling with Veridian palette. Recharts for charts. Ntfy for push notifications via cron job.

**Tech Stack:** Next.js 14, Prisma, Neon (PostgreSQL), NextAuth.js, bcryptjs, Tailwind CSS, Recharts, Ntfy, Railway

**Spec:** `docs/superpowers/specs/2026-09-22-gastus-design.md`

---

## File Structure

```
gastus/
  prisma/
    schema.prisma
    seed.ts
  src/
    app/
      layout.tsx                    # Root layout (nav, dark mode provider, session provider)
      page.tsx                      # Redirect to /dashboard
      globals.css                   # Tailwind + Veridian palette
      (auth)/
        login/page.tsx              # Login page
        cadastro/page.tsx           # Sign up page
      (app)/
        layout.tsx                  # Authenticated layout with sidebar nav
        dashboard/page.tsx          # Dashboard page
        parcelas/page.tsx           # Installments list + create
        recorrentes/page.tsx        # Recurring list + create
        fixos/page.tsx              # One-time fixed list + create
        categorias/page.tsx         # Categories management
        configuracoes/page.tsx      # Settings (Ntfy, notifications, dark mode)
    components/
      sidebar.tsx                   # Right-side nav menu
      expense-card.tsx              # Expense card for lists
      summary-cards.tsx             # Dashboard summary cards
      expense-list.tsx              # Dashboard expense list with pay button
      evolution-chart.tsx           # Recharts projection chart
      freedom-alert.tsx             # Freedom alert component
      csv-import-export.tsx         # Import/export buttons and logic
      dark-mode-toggle.tsx          # Dark mode toggle
      ui/                           # Shared UI primitives (button, input, modal, select)
        button.tsx
        input.tsx
        modal.tsx
        select.tsx
    lib/
      prisma.ts                     # Prisma client singleton
      auth.ts                       # NextAuth config
      status.ts                     # Computed status logic
      ntfy.ts                       # Ntfy notification helper
      csv.ts                        # CSV parse/generate helpers
      date.ts                       # Date/timezone helpers (UTC-3)
    api/
      auth/[...nextauth]/route.ts   # NextAuth route handler
      categorias/route.ts           # GET, POST categories
      categorias/[id]/route.ts      # PUT, DELETE category
      gastos/route.ts               # GET, POST expenses
      gastos/[id]/route.ts          # PUT, DELETE expense
      gastos/[id]/adiantar/route.ts # POST advance installments
      gastos/[id]/adiar/route.ts    # POST postpone installment
      pagamentos/route.ts           # POST mark as paid
      dashboard/route.ts            # GET dashboard data
      cron/notificacoes/route.ts    # POST cron notification job
      csv/exportar/route.ts         # GET export CSV
      csv/importar/route.ts         # POST import CSV
      configuracoes/route.ts        # GET, PUT user settings
  .env.example
  tailwind.config.ts
  next.config.js
```

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`, `next.config.js`, `tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `.env.example`, `tsconfig.json`, `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client next-auth bcryptjs recharts date-fns
npm install -D @types/bcryptjs ts-node
```

- [ ] **Step 3: Create .env.example**

```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
NEXTAUTH_SECRET="generate-a-secret-here"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="generate-a-cron-secret-here"
```

- [ ] **Step 4: Configure Tailwind with Veridian palette**

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        veridian: {
          50: "#f0f9f5",
          100: "#d5f0e3",
          200: "#aee0c8",
          300: "#7ecaa8",
          400: "#53b08a",
          500: "#40826D",
          600: "#2d6a57",
          700: "#255647",
          800: "#1f4539",
          900: "#1a3930",
          950: "#0d201b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Set up globals.css**

Replace `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors;
}
```

- [ ] **Step 6: Create root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gastus",
  description: "Controle de gastos fixos, parcelas e recorrentes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create redirect page**

Replace `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 8: Initialize git and commit**

```bash
git init
git add .
git commit -m "chore: setup Next.js project with Tailwind and Veridian palette"
```

---

## Task 2: Prisma Schema and Database

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init
```

- [ ] **Step 2: Write Prisma schema**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ExpenseType {
  INSTALLMENT
  RECURRING
  ONE_TIME
}

model User {
  id                 String    @id @default(cuid())
  name               String
  email              String    @unique
  password           String
  ntfyTopic          String?   @map("ntfy_topic")
  notifyDaysBefore   Int       @default(3) @map("notify_days_before")
  darkMode           Boolean   @default(false) @map("dark_mode")
  createdAt          DateTime  @default(now()) @map("created_at")

  expenses           Expense[]
  categories         Category[]

  @@map("users")
}

model Category {
  id          String    @id @default(cuid())
  name        String
  userId      String?   @map("user_id")
  predefined  Boolean   @default(false)

  user        User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expenses    Expense[]

  @@map("categories")
}

model Expense {
  id                    String      @id @default(cuid())
  userId                String      @map("user_id")
  categoryId            String      @map("category_id")
  type                  ExpenseType
  name                  String
  totalValue            Float       @map("total_value")
  installmentValue      Float?      @map("installment_value")
  totalInstallments     Int?        @map("total_installments")
  remainingInstallments Int?        @map("remaining_installments")
  startDate             DateTime?   @map("start_date")
  dueDay                Int         @map("due_day")
  dueMonth              Int?        @map("due_month")
  repeatsYearly         Boolean     @default(false) @map("repeats_yearly")
  active                Boolean     @default(true)
  createdAt             DateTime    @default(now()) @map("created_at")

  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  category              Category    @relation(fields: [categoryId], references: [id])
  payments              Payment[]

  @@map("expenses")
}

model Payment {
  id              String   @id @default(cuid())
  expenseId       String   @map("expense_id")
  value           Float
  paymentDate     DateTime @map("payment_date")
  referenceMonth  String   @map("reference_month")

  expense         Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)

  @@map("payments")
}
```

- [ ] **Step 3: Create Prisma client singleton**

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Create seed file**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCategories = [
  "Casa",
  "Saúde",
  "Lazer",
  "Transporte",
  "Educação",
  "Alimentação",
  "Outros",
];

async function main() {
  for (const name of defaultCategories) {
    await prisma.category.upsert({
      where: { id: name.toLowerCase() },
      update: {},
      create: {
        id: name.toLowerCase(),
        name,
        predefined: true,
        userId: null,
      },
    });
  }
  console.log("Seed completed: default categories created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 5: Add seed script to package.json**

Add to `package.json`:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

- [ ] **Step 6: Run migration and seed**

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

- [ ] **Step 7: Commit**

```bash
git add prisma/ src/lib/prisma.ts package.json
git commit -m "feat: add Prisma schema with User, Category, Expense, Payment models and seed"
```

---

## Task 3: Authentication (NextAuth.js)

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/cadastro/page.tsx`

- [ ] **Step 1: Create NextAuth config**

Create `src/lib/auth.ts`:

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
```

- [ ] **Step 2: Create NextAuth route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 3: Create sign up API route**

Create `src/app/api/auth/cadastro/route.ts`:

```typescript
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Todos os campos são obrigatórios" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 6 caracteres" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json(
      { error: "Este email já está em uso" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  return NextResponse.json({ message: "Conta criada com sucesso" });
}
```

- [ ] **Step 4: Create login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou senha incorretos");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
          Entrar no Gastus
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-veridian-500 focus:border-transparent outline-none"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-veridian-500 text-white font-medium hover:bg-veridian-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Não tem conta?{" "}
          <Link href="/cadastro" className="text-veridian-500 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create sign up page**

Create `src/app/(auth)/cadastro/page.tsx`:

```tsx
"use client";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
          Criar conta
        </h1>

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
            className="w-full py-2.5 rounded-lg bg-veridian-500 text-white font-medium hover:bg-veridian-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Já tem conta?{" "}
          <Link href="/login" className="text-veridian-500 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/app/"(auth)"/
git commit -m "feat: add authentication with NextAuth.js, login and sign up pages"
```

---

## Task 4: UI Primitives and Shared Components

**Files:**
- Create: `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/modal.tsx`, `src/components/ui/select.tsx`

- [ ] **Step 1: Create Button component**

Create `src/components/ui/button.tsx`:

```tsx
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50";
  const variants = {
    primary: "bg-veridian-500 text-white hover:bg-veridian-600",
    secondary: "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
```

- [ ] **Step 2: Create Input component**

Create `src/components/ui/input.tsx`:

```tsx
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-veridian-500 focus:border-transparent outline-none ${className}`}
        {...props}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create Modal component**

Create `src/components/ui/modal.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-black/50 rounded-2xl p-0 bg-white dark:bg-gray-900 shadow-xl max-w-lg w-full"
    >
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
```

- [ ] **Step 4: Create Select component**

Create `src/components/ui/select.tsx`:

```tsx
import { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <select
        className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-veridian-500 focus:border-transparent outline-none ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add shared UI primitives (Button, Input, Modal, Select)"
```

---

## Task 5: Layout, Sidebar Navigation, and Dark Mode

**Files:**
- Create: `src/components/sidebar.tsx`, `src/components/dark-mode-toggle.tsx`, `src/components/providers.tsx`, `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create session and dark mode providers**

Create `src/components/providers.tsx`:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from "react";

const DarkModeContext = createContext({
  dark: false,
  toggle: () => {},
});

export function useDarkMode() {
  return useContext(DarkModeContext);
}

function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Load from localStorage first for instant render, then sync from DB via settings API
    const stored = localStorage.getItem("gastus-dark-mode");
    if (stored === "true") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
    // Sync with DB preference
    fetch("/api/configuracoes")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && typeof data.darkMode === "boolean") {
          setDark(data.darkMode);
          localStorage.setItem("gastus-dark-mode", String(data.darkMode));
          if (data.darkMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      })
      .catch(() => {});
  }, []);

  function toggle() {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("gastus-dark-mode", String(next));
      // Persist to DB
      fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ darkMode: next }),
      }).catch(() => {});
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  }

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DarkModeProvider>{children}</DarkModeProvider>
    </SessionProvider>
  );
}
```

- [ ] **Step 2: Update root layout with providers**

Update `src/app/layout.tsx` to wrap children with `<Providers>`.

- [ ] **Step 3: Create dark mode toggle**

Create `src/components/dark-mode-toggle.tsx`:

```tsx
"use client";

import { useDarkMode } from "./providers";

export function DarkModeToggle() {
  const { dark, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={dark ? "Modo claro" : "Modo escuro"}
    >
      {dark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Create sidebar component**

Create `src/components/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { DarkModeToggle } from "./dark-mode-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/parcelas", label: "Parcelas", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { href: "/recorrentes", label: "Recorrentes", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
  { href: "/fixos", label: "Fixos Pontuais", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/categorias", label: "Categorias", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
  { href: "/configuracoes", label: "Configurações", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 right-4 z-50 md:hidden p-2 rounded-lg bg-veridian-500 text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-40 transition-transform ${collapsed ? "translate-x-full" : "translate-x-0"} md:translate-x-0 w-64 flex flex-col`}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-veridian-500">Gastus</h1>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCollapsed(true)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-veridian-50 dark:bg-veridian-950 text-veridian-500"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <DarkModeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 5: Create authenticated layout**

Create `src/app/(app)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="md:mr-64 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ src/app/layout.tsx src/app/"(app)"/layout.tsx
git commit -m "feat: add sidebar navigation (right-side), dark mode toggle, and authenticated layout"
```

---

## Task 6: Helper Libraries

**Files:**
- Create: `src/lib/status.ts`, `src/lib/date.ts`, `src/lib/ntfy.ts`, `src/lib/csv.ts`

- [ ] **Step 1: Create date helper**

Create `src/lib/date.ts`:

```typescript
import { format, addMonths } from "date-fns";

const BRAZIL_OFFSET = -3;

export function nowBrazil(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + BRAZIL_OFFSET * 3600000);
}

export function todayBrazil(): string {
  return format(nowBrazil(), "yyyy-MM-dd");
}

export function currentMonthBrazil(): string {
  return format(nowBrazil(), "yyyy-MM");
}

export function getDueDate(dueDay: number, referenceMonth: string): Date {
  const [year, month] = referenceMonth.split("-").map(Number);
  return new Date(year, month - 1, dueDay);
}

export function getInstallmentMonth(startDate: Date, offset: number): string {
  const date = addMonths(startDate, offset);
  return format(date, "yyyy-MM");
}
```

- [ ] **Step 2: Create status helper**

Create `src/lib/status.ts`:

```typescript
import { Payment } from "@prisma/client";
import { getDueDate, nowBrazil } from "./date";

export type ExpenseStatus = "pendente" | "pago" | "atrasado";

export function computeStatus(
  dueDay: number,
  referenceMonth: string,
  payments: Payment[]
): ExpenseStatus {
  const isPaid = payments.some((p) => p.referenceMonth === referenceMonth);
  if (isPaid) return "pago";

  const dueDate = getDueDate(dueDay, referenceMonth);
  const now = nowBrazil();

  // Compare dates only (no time). Mark as "atrasado" starting the day AFTER the due date
  const dueDateEnd = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + 1);
  if (now >= dueDateEnd) return "atrasado";
  return "pendente";
}
```

- [ ] **Step 3: Create Ntfy helper**

Create `src/lib/ntfy.ts`:

```typescript
export async function sendNtfyNotification(
  topic: string,
  title: string,
  message: string
): Promise<boolean> {
  try {
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: { Title: title },
      body: message,
    });
    return res.ok;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Create CSV helper**

Create `src/lib/csv.ts`:

```typescript
export function generateCSV(
  headers: string[],
  rows: string[][]
): string {
  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headerLine = headers.map(escape).join(",");
  const dataLines = rows.map((row) => row.map(escape).join(","));
  return [headerLine, ...dataLines].join("\n");
}

export function parseCSV(content: string): { headers: string[]; rows: string[][]; errors: number[] } {
  const lines = content.trim().split("\n");
  if (lines.length === 0) return { headers: [], rows: [], errors: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: string[][] = [];
  const errors: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length !== headers.length) {
      errors.push(i + 1);
    } else {
      rows.push(cols);
    }
  }

  return { headers, rows, errors };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/
git commit -m "feat: add helper libraries (date, status, ntfy, csv)"
```

---

## Task 7: Categories API and Page

**Files:**
- Create: `src/app/api/categorias/route.ts`, `src/app/api/categorias/[id]/route.ts`, `src/app/(app)/categorias/page.tsx`

- [ ] **Step 1: Create categories API routes**

Create `src/app/api/categorias/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;

  const categories = await prisma.category.findMany({
    where: {
      OR: [{ predefined: true }, { userId }],
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const { name } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: { name, userId, predefined: false },
  });

  return NextResponse.json(category);
}
```

- [ ] **Step 2: Create category by ID routes (update, delete)**

Create `src/app/api/categorias/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const { name } = await request.json();

  const category = await prisma.category.findFirst({
    where: { id: params.id, userId, predefined: false },
  });

  if (!category) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  const updated = await prisma.category.update({
    where: { id: params.id },
    data: { name },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;

  const category = await prisma.category.findFirst({
    where: { id: params.id, userId, predefined: false },
  });

  if (!category) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  const outrosCategory = await prisma.category.findFirst({
    where: { name: "Outros", predefined: true },
  });

  if (outrosCategory) {
    await prisma.expense.updateMany({
      where: { categoryId: params.id, userId },
      data: { categoryId: outrosCategory.id },
    });
  }

  await prisma.category.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "Categoria excluída" });
}
```

- [ ] **Step 3: Create categories page**

Create `src/app/(app)/categorias/page.tsx`:
- `"use client"` page that fetches `GET /api/categorias` on mount
- Renders list of categories as cards. Each card shows: name, badge "Padrão" if `predefined === true`
- Custom categories (not predefined) show edit (pencil icon) and delete (trash icon) buttons
- "Nova categoria" button opens a Modal with an Input for name and a Button to submit `POST /api/categorias`
- Edit opens same Modal pre-filled, submits `PUT /api/categorias/[id]`
- Delete shows confirmation modal, submits `DELETE /api/categorias/[id]`
- After any mutation, refetch the list
- Use the shared `Button`, `Input`, `Modal` components from `src/components/ui/`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/categorias/ src/app/"(app)"/categorias/
git commit -m "feat: add categories CRUD API and management page"
```

---

## Task 8: Expenses API (CRUD for all 3 types)

**Files:**
- Create: `src/app/api/gastos/route.ts`, `src/app/api/gastos/[id]/route.ts`

- [ ] **Step 1: Create expenses GET and POST routes**

Create `src/app/api/gastos/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const where: any = { userId };
  if (type) where.type = type;

  const expenses = await prisma.expense.findMany({
    where,
    include: { category: true, payments: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await request.json();

  const expense = await prisma.expense.create({
    data: {
      userId,
      categoryId: body.categoryId,
      type: body.type,
      name: body.name,
      totalValue: body.totalValue,
      installmentValue: body.installmentValue || null,
      totalInstallments: body.totalInstallments || null,
      remainingInstallments: body.remainingInstallments || null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      dueDay: body.dueDay,
      dueMonth: body.dueMonth || null,
      repeatsYearly: body.repeatsYearly || false,
    },
    include: { category: true },
  });

  return NextResponse.json(expense);
}
```

- [ ] **Step 2: Create expense by ID routes (update, delete)**

Create `src/app/api/gastos/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await request.json();

  const expense = await prisma.expense.findFirst({
    where: { id: params.id, userId },
  });

  if (!expense) {
    return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
  }

  const updated = await prisma.expense.update({
    where: { id: params.id },
    data: {
      name: body.name ?? expense.name,
      categoryId: body.categoryId ?? expense.categoryId,
      totalValue: body.totalValue ?? expense.totalValue,
      installmentValue: body.installmentValue ?? expense.installmentValue,
      dueDay: body.dueDay ?? expense.dueDay,
      dueMonth: body.dueMonth ?? expense.dueMonth,
      repeatsYearly: body.repeatsYearly ?? expense.repeatsYearly,
      active: body.active ?? expense.active,
    },
    include: { category: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;

  const expense = await prisma.expense.findFirst({
    where: { id: params.id, userId },
  });

  if (!expense) {
    return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "Gasto excluído" });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/gastos/
git commit -m "feat: add expenses CRUD API routes"
```

---

## Task 9: Advance and Postpone Installments API

**Files:**
- Create: `src/app/api/gastos/[id]/adiantar/route.ts`, `src/app/api/gastos/[id]/adiar/route.ts`

- [ ] **Step 1: Create advance installments route**

Create `src/app/api/gastos/[id]/adiantar/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, addMonths } from "date-fns";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const { quantity } = await request.json();

  const expense = await prisma.expense.findFirst({
    where: { id: params.id, userId, type: "INSTALLMENT", active: true },
  });

  if (!expense || !expense.remainingInstallments || !expense.installmentValue) {
    return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
  }

  const remaining = expense.remainingInstallments;
  const toAdvance = Math.min(quantity, remaining);
  const newRemaining = remaining - toAdvance;
  const now = new Date();

  // Create payment records for advanced installments, each with its correct future referenceMonth
  const paidCount = await prisma.payment.count({ where: { expenseId: expense.id } });
  const payments = Array.from({ length: toAdvance }, (_, i) => {
    const monthOffset = paidCount + i;
    const refDate = addMonths(expense.startDate!, monthOffset);
    return {
      expenseId: expense.id,
      value: expense.installmentValue!,
      paymentDate: now,
      referenceMonth: format(refDate, "yyyy-MM"),
    };
  });

  await prisma.$transaction([
    prisma.payment.createMany({ data: payments }),
    prisma.expense.update({
      where: { id: expense.id },
      data: {
        remainingInstallments: newRemaining,
        active: newRemaining <= 0 ? false : true,
      },
    }),
  ]);

  return NextResponse.json({
    message: newRemaining <= 0
      ? "Compra finalizada!"
      : `${toAdvance} parcela(s) adiantada(s). Restam ${newRemaining}.`,
    remaining: newRemaining,
    finalized: newRemaining <= 0,
  });
}
```

- [ ] **Step 2: Create postpone installment route**

Create `src/app/api/gastos/[id]/adiar/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMonths } from "date-fns";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;

  const expense = await prisma.expense.findFirst({
    where: { id: params.id, userId, type: "INSTALLMENT", active: true },
  });

  if (!expense || !expense.startDate) {
    return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
  }

  const newStartDate = addMonths(expense.startDate, 1);

  await prisma.expense.update({
    where: { id: expense.id },
    data: { startDate: newStartDate },
  });

  return NextResponse.json({ message: "Parcela adiada para o próximo mês" });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/gastos/
git commit -m "feat: add advance and postpone installment API routes"
```

---

## Task 10: Payments API (Mark as Paid)

**Files:**
- Create: `src/app/api/pagamentos/route.ts`

- [ ] **Step 1: Create payment route**

Create `src/app/api/pagamentos/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentMonthBrazil } from "@/lib/date";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const { expenseId, value, referenceMonth } = await request.json();

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  if (!expense) {
    return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
  }

  const month = referenceMonth || currentMonthBrazil();

  const existingPayment = await prisma.payment.findFirst({
    where: { expenseId, referenceMonth: month },
  });

  if (existingPayment) {
    return NextResponse.json({ error: "Já foi marcado como pago neste mês" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      expenseId,
      value: value || expense.installmentValue || expense.totalValue,
      paymentDate: new Date(),
      referenceMonth: month,
    },
  });

  // For installments, decrease remaining
  if (expense.type === "INSTALLMENT" && expense.remainingInstallments) {
    const newRemaining = expense.remainingInstallments - 1;
    await prisma.expense.update({
      where: { id: expense.id },
      data: {
        remainingInstallments: newRemaining,
        active: newRemaining <= 0 ? false : true,
      },
    });
  }

  // For non-repeating one-time, deactivate after payment
  if (expense.type === "ONE_TIME" && !expense.repeatsYearly) {
    await prisma.expense.update({
      where: { id: expense.id },
      data: { active: false },
    });
  }

  return NextResponse.json(payment);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/pagamentos/
git commit -m "feat: add payments API route (mark as paid)"
```

---

## Task 11: Dashboard API and Page

**Files:**
- Create: `src/app/api/dashboard/route.ts`, `src/app/(app)/dashboard/page.tsx`, `src/components/summary-cards.tsx`, `src/components/expense-list.tsx`, `src/components/evolution-chart.tsx`, `src/components/freedom-alert.tsx`

- [ ] **Step 1: Create dashboard API route**

Create `src/app/api/dashboard/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentMonthBrazil, nowBrazil } from "@/lib/date";
import { computeStatus } from "@/lib/status";
import { addMonths, format, subMonths } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const currentMonth = currentMonthBrazil();
  const [currentYear, currentMonthNum] = currentMonth.split("-").map(Number);

  // Get all active expenses with payments
  const expenses = await prisma.expense.findMany({
    where: { userId, active: true },
    include: { category: true, payments: true },
  });

  // Filter expenses that have a due in the current month
  const monthlyExpenses = expenses.filter((exp) => {
    if (exp.type === "RECURRING") return true;
    if (exp.type === "ONE_TIME") {
      if (exp.dueMonth === null) return false;
      if (exp.dueMonth !== currentMonthNum) return false;
      return true;
    }
    if (exp.type === "INSTALLMENT" && exp.startDate && exp.totalInstallments) {
      const start = new Date(exp.startDate);
      const startMonth = start.getFullYear() * 12 + start.getMonth();
      const currentM = currentYear * 12 + (currentMonthNum - 1);
      const offset = currentM - startMonth;
      return offset >= 0 && offset < exp.totalInstallments;
    }
    return false;
  });

  // Compute status for each
  const items = monthlyExpenses.map((exp) => ({
    ...exp,
    status: computeStatus(exp.dueDay, currentMonth, exp.payments),
    value: exp.installmentValue || exp.totalValue,
  }));

  // Summary
  const totalToPay = items.reduce((sum, i) => sum + i.value, 0);
  const totalPaid = items.filter((i) => i.status === "pago").reduce((sum, i) => sum + i.value, 0);
  const dueCount = items.length;

  // Projection: for each future month, calculate total monthly expense
  const installments = expenses.filter((e) => e.type === "INSTALLMENT" && e.startDate && e.totalInstallments);
  const recurring = expenses.filter((e) => e.type === "RECURRING");
  const oneTime = expenses.filter((e) => e.type === "ONE_TIME" && e.repeatsYearly);

  let maxFutureMonths = 0;
  for (const inst of installments) {
    const start = new Date(inst.startDate!);
    const startM = start.getFullYear() * 12 + start.getMonth();
    const currentM = currentYear * 12 + (currentMonthNum - 1);
    const remaining = inst.totalInstallments! - (currentM - startM);
    if (remaining > maxFutureMonths) maxFutureMonths = remaining;
  }
  maxFutureMonths = Math.max(maxFutureMonths, 1);

  const projection = Array.from({ length: maxFutureMonths }, (_, i) => {
    const monthDate = addMonths(new Date(currentYear, currentMonthNum - 1, 1), i);
    const monthStr = format(monthDate, "yyyy-MM");
    const monthNum = monthDate.getMonth() + 1;
    const monthYear12 = monthDate.getFullYear() * 12 + monthDate.getMonth();

    let total = 0;
    // Recurring always count
    total += recurring.reduce((s, e) => s + e.totalValue, 0);
    // One-time yearly in that month
    total += oneTime.filter((e) => e.dueMonth === monthNum).reduce((s, e) => s + e.totalValue, 0);
    // Installments active in that month
    for (const inst of installments) {
      const start = new Date(inst.startDate!);
      const startM = start.getFullYear() * 12 + start.getMonth();
      const offset = monthYear12 - startM;
      if (offset >= 0 && offset < inst.totalInstallments!) {
        total += inst.installmentValue || 0;
      }
    }

    return { month: monthStr, total };
  });

  // Freedom alert: installments that became inactive last month
  const lastMonth = format(subMonths(new Date(currentYear, currentMonthNum - 1, 1), 1), "yyyy-MM");
  const freedomAlerts = await prisma.expense.findMany({
    where: {
      userId,
      type: "INSTALLMENT",
      active: false,
      remainingInstallments: 0,
    },
    include: { payments: true },
  });
  // Filter to those whose last payment was last month
  const freedomItems = freedomAlerts.filter((e) => {
    const lastPayment = e.payments.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0];
    return lastPayment && lastPayment.referenceMonth === lastMonth;
  }).map((e) => ({ name: e.name, freedValue: e.installmentValue || 0 }));

  return NextResponse.json({
    items: items.sort((a, b) => a.dueDay - b.dueDay),
    summary: { totalToPay, totalPaid, dueCount },
    projection,
    freedomAlerts: freedomItems,
  });
}
```

- [ ] **Step 2: Create summary cards component**

Create `src/components/summary-cards.tsx` with 3 cards: "Total do mês", "Já pago", "Vencimentos"

- [ ] **Step 3: Create expense list component**

Create `src/components/expense-list.tsx` with expense rows, status badges (color coded), category filter, and "Marcar como pago" button

- [ ] **Step 4: Create evolution chart component**

Create `src/components/evolution-chart.tsx` using Recharts AreaChart showing future month projections

- [ ] **Step 5: Create freedom alert component**

Create `src/components/freedom-alert.tsx` showing banner when a installment finished last month

- [ ] **Step 6: Create dashboard page**

Create `src/app/(app)/dashboard/page.tsx` composing all dashboard components

- [ ] **Step 7: Commit**

```bash
git add src/app/api/dashboard/ src/app/"(app)"/dashboard/ src/components/
git commit -m "feat: add dashboard with summary, expense list, projection chart, and freedom alert"
```

---

## Task 12: Expense Pages (Parcelas, Recorrentes, Fixos)

**Files:**
- Create: `src/app/(app)/parcelas/page.tsx`, `src/app/(app)/recorrentes/page.tsx`, `src/app/(app)/fixos/page.tsx`, `src/components/expense-card.tsx`

- [ ] **Step 1: Create expense card component**

Create `src/components/expense-card.tsx` showing expense info with edit/delete/advance/postpone actions based on type

- [ ] **Step 2: Create parcelas page**

Create `src/app/(app)/parcelas/page.tsx` (`"use client"`):
- Fetches `GET /api/gastos?type=INSTALLMENT` on mount
- Also fetches `GET /api/categorias` for the create form select
- Renders ExpenseCard for each, showing: name, category, `remainingInstallments/totalInstallments` as progress bar, installmentValue per month
- "Nova parcela" button opens Modal with form fields:
  - name (Input text), totalValue (Input number), totalInstallments (Input number), startDate (Input date), dueDay (Input number 1-31), categoryId (Select from categories)
  - installmentValue is auto-calculated: totalValue / totalInstallments
  - remainingInstallments = totalInstallments
  - Submit: `POST /api/gastos` with `type: "INSTALLMENT"`
- Each card has "Adiantar" button (opens modal asking quantity, submits `POST /api/gastos/[id]/adiantar`) and "Adiar" button (submits `POST /api/gastos/[id]/adiar` directly with confirmation)
- Inactive (finalized) installments shown at bottom with "Finalizada" badge

- [ ] **Step 3: Create recorrentes page**

Create `src/app/(app)/recorrentes/page.tsx` (`"use client"`):
- Fetches `GET /api/gastos?type=RECURRING` on mount + `GET /api/categorias`
- Renders ExpenseCard for each active recurring: name, category, totalValue/mês, dueDay
- "Novo recorrente" button opens Modal with form fields:
  - name (Input text), totalValue (Input number, label "Valor mensal"), dueDay (Input number 1-31), categoryId (Select)
  - Submit: `POST /api/gastos` with `type: "RECURRING"`
- Each card has "Cancelar" button: `PUT /api/gastos/[id]` with `{ active: false }` after confirmation

- [ ] **Step 4: Create fixos page**

Create `src/app/(app)/fixos/page.tsx` (`"use client"`):
- Fetches `GET /api/gastos?type=ONE_TIME` on mount + `GET /api/categorias`
- Renders ExpenseCard for each: name, category, totalValue, dueMonth/dueDay, badge "Anual" if repeatsYearly
- "Novo fixo pontual" button opens Modal with form fields:
  - name (Input text), totalValue (Input number), dueDay (Input number 1-31), dueMonth (Select months 1-12), repeatsYearly (checkbox), categoryId (Select)
  - Submit: `POST /api/gastos` with `type: "ONE_TIME"`
- Each card has edit and delete buttons

- [ ] **Step 5: Commit**

```bash
git add src/app/"(app)"/ src/components/expense-card.tsx
git commit -m "feat: add expense pages for installments, recurring, and one-time expenses"
```

---

## Task 13: Settings Page

**Files:**
- Create: `src/app/api/configuracoes/route.ts`, `src/app/(app)/configuracoes/page.tsx`

- [ ] **Step 1: Create settings API route**

Create `src/app/api/configuracoes/route.ts` with GET (return user settings) and PUT (update ntfyTopic, notifyDaysBefore, darkMode)

- [ ] **Step 2: Create settings page**

Create `src/app/(app)/configuracoes/page.tsx` with form fields for:
- Tópico Ntfy (text input)
- Dias de antecedência da notificação (number input, default 3)
- Modo escuro (toggle, synced with DarkModeContext)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/configuracoes/ src/app/"(app)"/configuracoes/
git commit -m "feat: add settings page with Ntfy topic, notification days, and dark mode"
```

---

## Task 14: CSV Import/Export

**Files:**
- Create: `src/app/api/csv/exportar/route.ts`, `src/app/api/csv/importar/route.ts`, `src/components/csv-import-export.tsx`

- [ ] **Step 1: Create export CSV route**

Create `src/app/api/csv/exportar/route.ts` that generates CSV from all user expenses and returns as downloadable file

- [ ] **Step 2: Create import CSV route**

Create `src/app/api/csv/importar/route.ts` that parses uploaded CSV, creates expenses, and returns count of imported + errors

- [ ] **Step 3: Create import/export component**

Create `src/components/csv-import-export.tsx` with export button and import file picker. Show import results (success count, error lines)

- [ ] **Step 4: Add component to settings page**

Add the CSV import/export component to the settings page

- [ ] **Step 5: Commit**

```bash
git add src/app/api/csv/ src/components/csv-import-export.tsx src/app/"(app)"/configuracoes/
git commit -m "feat: add CSV import and export functionality"
```

---

## Task 15: Ntfy Notification Cron

**Files:**
- Create: `src/app/api/cron/notificacoes/route.ts`

- [ ] **Step 1: Create cron notification route**

Create `src/app/api/cron/notificacoes/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNtfyNotification } from "@/lib/ntfy";
import { nowBrazil, currentMonthBrazil } from "@/lib/date";
import { addDays, addMonths, format } from "date-fns";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const now = nowBrazil();
  const currentMonth = currentMonthBrazil();

  // Find all users with ntfyTopic configured
  const users = await prisma.user.findMany({
    where: { ntfyTopic: { not: null } },
  });

  let sent = 0;

  for (const user of users) {
    const checkDate = addDays(now, user.notifyDaysBefore);
    const checkDay = checkDate.getDate();
    const checkMonth = format(checkDate, "yyyy-MM");

    // Find active expenses due on the check date
    const expenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        active: true,
        dueDay: checkDay,
        payments: {
          none: { referenceMonth: checkMonth },
        },
      },
      include: { payments: true },
    });

    for (const expense of expenses) {
      // ONE_TIME: only notify in the correct dueMonth (or every year if repeatsYearly)
      if (expense.type === "ONE_TIME" && expense.dueMonth !== null) {
        const checkMonthNum = parseInt(checkMonth.split("-")[1]);
        if (checkMonthNum !== expense.dueMonth) continue;
      }

      // INSTALLMENT: check if this month falls within the installment range
      if (expense.type === "INSTALLMENT" && expense.startDate && expense.totalInstallments) {
        const startMonth = new Date(expense.startDate);
        const endMonth = addMonths(startMonth, expense.totalInstallments - 1);
        const checkDate2 = new Date(parseInt(checkMonth.split("-")[0]), parseInt(checkMonth.split("-")[1]) - 1, 1);
        if (checkDate2 < new Date(startMonth.getFullYear(), startMonth.getMonth(), 1) || checkDate2 > endMonth) continue;
      }

      const success = await sendNtfyNotification(
        user.ntfyTopic!,
        `Vencimento próximo: ${expense.name}`,
        `R$ ${expense.installmentValue || expense.totalValue} vence dia ${expense.dueDay}/${checkMonth.split("-")[1]}`
      );
      if (success) sent++;
    }
  }

  return NextResponse.json({ message: `${sent} notificação(ões) enviada(s)` });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/cron/
git commit -m "feat: add Ntfy notification cron job API route"
```

---

## Task 16: Final Polish and Deploy Config

**Files:**
- Create: `railway.json`, `Procfile` (if needed)
- Modify: `next.config.js`

- [ ] **Step 1: Update next.config.js for production**

Ensure `next.config.js` has proper output config for Railway.

- [ ] **Step 2: Create railway.json for cron**

Create `railway.json`:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npm start",
    "cronSchedule": null
  }
}
```

Note: The cron for notifications will be configured via Railway dashboard as a separate cron service calling `POST /api/cron/notificacoes` at `0 11 * * *` (8h UTC-3 = 11h UTC) with the CRON_SECRET header.

- [ ] **Step 3: Create .env.example final version**

Update `.env.example` with all required variables.

- [ ] **Step 4: Commit**

```bash
git add railway.json next.config.js .env.example
git commit -m "chore: add Railway deploy config and finalize env variables"
```

- [ ] **Step 5: Initialize GitHub repo and push**

```bash
git remote add origin <github-url>
git branch -M main
git push -u origin main
```
