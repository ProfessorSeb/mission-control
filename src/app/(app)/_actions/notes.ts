"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeNote } from "@/lib/vault";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function noteHref(relPath: string): string {
  const clean = relPath.replace(/\\/g, "/").replace(/^\//, "");
  const parts = clean.split("/").map(encodeURIComponent);
  return `/notes/${parts.join("/")}`;
}

export async function createNote(formData: FormData) {
  const folder = String(formData.get("folder") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!title) throw new Error("title is required");

  const safeFolder = folder
    ? folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+/, "")
    : "";

  const file = slugify(title) || crypto.randomUUID().slice(0, 8);
  const relPath = `${safeFolder ? safeFolder + "/" : ""}${file}.md`;

  const content = `---\ntitle: ${title.replace(/\n/g, " ")}\ncreated: ${new Date().toISOString()}\n---\n\n# ${title}\n\n`;

  await writeNote(relPath, content);

  revalidatePath("/notes");
  redirect(noteHref(relPath));
}

export async function saveNote(relPath: string, formData: FormData) {
  const content = String(formData.get("content") ?? "");

  await writeNote(relPath, content);

  revalidatePath("/notes");
  revalidatePath(noteHref(relPath));
  redirect(noteHref(relPath));
}
