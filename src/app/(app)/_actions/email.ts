"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";

export async function createEmailWatch(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const query = String(formData.get("query") ?? "").trim();
  const maxResultsRaw = String(formData.get("maxResults") ?? "10").trim();
  const maxResults = Math.max(1, Math.min(50, Number(maxResultsRaw) || 10));

  if (!name) throw new Error("name is required");
  if (!query) throw new Error("query is required");

  await prisma.emailWatch.create({
    data: {
      name,
      query,
      maxResults,
    },
  });

  revalidatePath("/mail");
}

export async function deleteEmailWatch(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("id is required");

  await prisma.emailWatch.delete({ where: { id } });
  revalidatePath("/mail");
}

export async function toggleEmailWatch(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("id is required");

  const cur = await prisma.emailWatch.findUnique({ where: { id } });
  if (!cur) throw new Error("watch not found");

  await prisma.emailWatch.update({
    where: { id },
    data: { enabled: !cur.enabled },
  });

  revalidatePath("/mail");
}
