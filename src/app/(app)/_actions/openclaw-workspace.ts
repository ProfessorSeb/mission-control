"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { OpenClawFileKey } from "@/lib/openclaw-workspace";
import { writeManagedFile } from "@/lib/openclaw-workspace";

function hrefForKey(key: OpenClawFileKey) {
  return `/openclaw/${encodeURIComponent(key)}`;
}

export async function saveOpenClawFile(key: OpenClawFileKey, formData: FormData) {
  const content = String(formData.get("content") ?? "");

  await writeManagedFile(key, content);

  revalidatePath("/openclaw");
  revalidatePath(hrefForKey(key));
  redirect(hrefForKey(key));
}
