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
