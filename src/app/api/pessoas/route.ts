import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const userId = (session.user as any).id;

  const persons = await prisma.person.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(persons);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const userId = (session.user as any).id;

  const { name } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const person = await prisma.person.create({
    data: { name: name.trim(), userId },
  });

  return NextResponse.json(person);
}
