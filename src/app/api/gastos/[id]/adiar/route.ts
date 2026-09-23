import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMonths } from "date-fns";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id, userId, type: "INSTALLMENT", active: true },
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
