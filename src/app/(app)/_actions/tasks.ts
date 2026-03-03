"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { TaskPriority, TaskStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

function parseStatus(value: FormDataEntryValue | null): TaskStatus {
  const v = typeof value === "string" ? value : "";
  if (Object.values(TaskStatus).includes(v as TaskStatus)) return v as TaskStatus;
  return TaskStatus.INBOX;
}

function parsePriority(value: FormDataEntryValue | null): TaskPriority {
  const v = typeof value === "string" ? value : "";
  if (Object.values(TaskPriority).includes(v as TaskPriority))
    return v as TaskPriority;
  return TaskPriority.P2;
}

function parseDueAt(value: FormDataEntryValue | null): Date | null {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) {
    // Keep it simple for now. We can upgrade this to proper form errors later.
    throw new Error("Title is required");
  }

  const status = parseStatus(formData.get("status"));
  const priority = parsePriority(formData.get("priority"));
  const dueAt = parseDueAt(formData.get("dueAt"));

  await prisma.task.create({
    data: {
      title,
      description: description || null,
      status,
      priority,
      dueAt,
    },
  });

  revalidatePath("/board");
  redirect("/board");
}

export async function updateTask(taskId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) throw new Error("Title is required");

  const status = parseStatus(formData.get("status"));
  const priority = parsePriority(formData.get("priority"));
  const dueAt = parseDueAt(formData.get("dueAt"));

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description: description || null,
      status,
      priority,
      dueAt,
    },
  });

  revalidatePath("/board");
  revalidatePath(`/tasks/${taskId}`);
  redirect("/board");
}

export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/board");
  redirect("/board");
}

export async function createTaskFromRun(formData: FormData) {
  const runKey = String(formData.get("runKey") ?? "").trim();
  const runLabel = String(formData.get("runLabel") ?? "").trim();
  const runTask = String(formData.get("runTask") ?? "").trim();

  if (!runKey) throw new Error("runKey is required");

  const title = runLabel || "OpenClaw run";
  const description = runTask
    ? `Imported from OpenClaw run.\n\nTask:\n${runTask}`
    : "Imported from OpenClaw run.";

  await prisma.task.upsert({
    where: { runKey },
    update: {
      title,
      description,
      source: "openclaw",
    },
    create: {
      title,
      description,
      status: TaskStatus.INBOX,
      priority: TaskPriority.P2,
      source: "openclaw",
      runKey,
    },
  });

  revalidatePath("/board");
  revalidatePath("/runs");
  redirect("/board");
}
