import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ntfyTopic: true,
      notifyDaysBefore: true,
      darkMode: true,
    },
  });

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await request.json();

  const data: any = {};
  if (typeof body.ntfyTopic === "string") data.ntfyTopic = body.ntfyTopic || null;
  if (typeof body.notifyDaysBefore === "number") data.notifyDaysBefore = body.notifyDaysBefore;
  if (typeof body.darkMode === "boolean") data.darkMode = body.darkMode;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      ntfyTopic: true,
      notifyDaysBefore: true,
      darkMode: true,
    },
  });

  return NextResponse.json(user);
}
