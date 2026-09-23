import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCSV } from "@/lib/csv";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;

  const expenses = await prisma.expense.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  const tipoMap: Record<string, string> = {
    INSTALLMENT: "PARCELA",
    RECURRING: "RECORRENTE",
    ONE_TIME: "FIXO",
  };

  const headers = ["tipo", "nome", "valor", "categoria", "dia_vencimento", "parcelas_restantes"];
  const rows = expenses.map((e) => [
    tipoMap[e.type] ?? e.type,
    e.name,
    String(e.totalValue),
    e.category.name,
    String(e.dueDay),
    String(e.remainingInstallments ?? ""),
  ]);

  const csv = generateCSV(headers, rows);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gastos.csv"',
    },
  });
}
