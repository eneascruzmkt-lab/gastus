import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV } from "@/lib/csv";
import { ExpenseType } from "@/generated/prisma/client";

const tipoMap: Record<string, ExpenseType> = {
  PARCELA: ExpenseType.INSTALLMENT,
  RECORRENTE: ExpenseType.RECURRING,
  FIXO: ExpenseType.ONE_TIME,
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }

  const content = await file.text();
  const { headers, rows, errors } = parseCSV(content);

  const expectedCols = ["tipo", "nome", "valor", "categoria", "dia_vencimento"];
  const missingCols = expectedCols.filter((col) => !headers.includes(col));
  if (missingCols.length > 0) {
    return NextResponse.json(
      { error: `Colunas obrigatórias ausentes: ${missingCols.join(", ")}` },
      { status: 400 }
    );
  }

  const idx = (col: string) => headers.indexOf(col);

  let imported = 0;
  const rowErrors = [...errors];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNumber = i + 2; // +1 for header, +1 for 1-based

    try {
      const tipoRaw = row[idx("tipo")]?.trim().toUpperCase();
      const nome = row[idx("nome")]?.trim();
      const valorRaw = row[idx("valor")]?.trim();
      const categoriaNome = row[idx("categoria")]?.trim();
      const diaDupdate = row[idx("dia_vencimento")]?.trim();

      const type = tipoMap[tipoRaw];
      if (!type || !nome || !categoriaNome || !diaDupdate) {
        rowErrors.push(lineNumber);
        continue;
      }

      const valor = parseFloat(valorRaw);
      const dueDay = parseInt(diaDupdate, 10);

      if (isNaN(valor) || isNaN(dueDay)) {
        rowErrors.push(lineNumber);
        continue;
      }

      // Encontrar ou criar categoria
      let category = await prisma.category.findFirst({
        where: {
          name: categoriaNome,
          OR: [{ predefined: true }, { userId }],
        },
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: categoriaNome, userId, predefined: false },
        });
      }

      await prisma.expense.create({
        data: {
          userId,
          categoryId: category.id,
          type,
          name: nome,
          totalValue: valor,
          dueDay,
        },
      });

      imported++;
    } catch {
      rowErrors.push(lineNumber);
    }
  }

  return NextResponse.json({ imported, errors: rowErrors });
}
