"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { TaskPriority, TaskStatus } from "@/generated/prisma";
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
  const runId = String(formData.get("runId") ?? "").trim();
  const childSessionKey = String(formData.get("childSessionKey") ?? "").trim();

  if (!runKey) throw new Error("runKey is required");

  const title = runLabel || "OpenClaw run";

  const descriptionLines = [
    "Imported from OpenClaw run.",
    runId ? `Run: ${runId}` : "",
    childSessionKey ? `Child session: ${childSessionKey}` : "",
    runTask ? `\nTask:\n${runTask}` : "",
  ].filter(Boolean);

  const description = descriptionLines.join("\n");

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

export async function createTaskFromEmail(formData: FormData) {
  const threadId = String(formData.get("threadId") ?? "").trim();
  const from = String(formData.get("from") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();

  if (!threadId) throw new Error("threadId is required");

  const runKey = `gmail:${threadId}`;
  const title = subject ? `Email: ${subject}` : "Email";
  const descriptionLines = [
    "Imported from Gmail.",
    from ? `From: ${from}` : "",
    date ? `Date: ${date}` : "",
    `Thread: ${threadId}`,
  ].filter(Boolean);

  await prisma.task.upsert({
    where: { runKey },
    update: {
      title,
      description: descriptionLines.join("\n"),
      source: "gmail",
    },
    create: {
      title,
      description: descriptionLines.join("\n"),
      status: TaskStatus.INBOX,
      priority: TaskPriority.P2,
      source: "gmail",
      runKey,
    },
  });

  revalidatePath("/board");
  revalidatePath("/mail");
  redirect("/board");
}
