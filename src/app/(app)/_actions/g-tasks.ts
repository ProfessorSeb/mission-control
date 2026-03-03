"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { tasksAdd, tasksDone, tasksUndo } from "@/lib/gog";

function safeReturnTo(formData: FormData, fallback: string) {
  const rt = String(formData.get("returnTo") ?? "").trim();
  if (rt.startsWith("/")) return rt;
  return fallback;
}

export async function addGoogleTask(formData: FormData) {
  const tasklistId = String(formData.get("tasklistId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const due = String(formData.get("due") ?? "").trim();

  if (!tasklistId) throw new Error("tasklistId is required");
  if (!title) throw new Error("title is required");

  await tasksAdd({
    tasklistId,
    title,
    notes: notes || undefined,
    due: due || undefined,
  });

  revalidatePath("/g-tasks");
  redirect(safeReturnTo(formData, `/g-tasks?listId=${encodeURIComponent(tasklistId)}`));
}

export async function markGoogleTaskDone(formData: FormData) {
  const tasklistId = String(formData.get("tasklistId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();

  if (!tasklistId) throw new Error("tasklistId is required");
  if (!taskId) throw new Error("taskId is required");

  await tasksDone({ tasklistId, taskId });

  revalidatePath("/g-tasks");
  redirect(safeReturnTo(formData, `/g-tasks?listId=${encodeURIComponent(tasklistId)}`));
}

export async function markGoogleTaskUndone(formData: FormData) {
  const tasklistId = String(formData.get("tasklistId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();

  if (!tasklistId) throw new Error("tasklistId is required");
  if (!taskId) throw new Error("taskId is required");

  await tasksUndo({ tasklistId, taskId });

  revalidatePath("/g-tasks");
  redirect(safeReturnTo(formData, `/g-tasks?listId=${encodeURIComponent(tasklistId)}`));
}
