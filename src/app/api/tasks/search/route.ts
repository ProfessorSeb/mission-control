import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ tasks: [] });
  }

  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ title: { contains: q } }, { description: { contains: q } }],
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 20,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
    },
  });

  return NextResponse.json({ tasks });
}
