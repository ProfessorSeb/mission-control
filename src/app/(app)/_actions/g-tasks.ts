"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
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
  const missionControlTaskId = String(
    formData.get("missionControlTaskId") ?? "",
  ).trim();

  if (!tasklistId) throw new Error("tasklistId is required");
  if (!taskId) throw new Error("taskId is required");

  await tasksDone({ tasklistId, taskId });

  const googleTaskKey = `gtasks:${tasklistId}:${taskId}`;

  // Reverse sync: if this Google Task is linked to a Mission Control task, mark it DONE.
  if (missionControlTaskId) {
    await prisma.task.update({
      where: { id: missionControlTaskId },
      data: { status: "DONE" },
    });
  } else {
    await prisma.task.updateMany({
      where: {
        OR: [
          { googleTaskKey },
          { runKey: googleTaskKey }, // legacy
          {
            AND: [
              { googleTaskListId: tasklistId },
              { googleTaskId: taskId },
            ],
          },
        ],
      },
      data: { status: "DONE" },
    });
  }

  revalidatePath("/board");
  revalidatePath("/tasks");
  revalidatePath("/g-tasks");
  if (missionControlTaskId) revalidatePath(`/tasks/${missionControlTaskId}`);

  redirect(safeReturnTo(formData, `/g-tasks?listId=${encodeURIComponent(tasklistId)}`));
}

export async function markGoogleTaskUndone(formData: FormData) {
  const tasklistId = String(formData.get("tasklistId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  const missionControlTaskId = String(
    formData.get("missionControlTaskId") ?? "",
  ).trim();

  if (!tasklistId) throw new Error("tasklistId is required");
  if (!taskId) throw new Error("taskId is required");

  await tasksUndo({ tasklistId, taskId });

  const googleTaskKey = `gtasks:${tasklistId}:${taskId}`;

  // Reverse sync: if linked, move MC task out of DONE.
  // We only change tasks that are currently DONE to avoid surprising moves.
  if (missionControlTaskId) {
    const cur = await prisma.task.findUnique({ where: { id: missionControlTaskId } });
    if (cur?.status === "DONE") {
      await prisma.task.update({
        where: { id: missionControlTaskId },
        data: { status: "DOING" },
      });
    }
  } else {
    await prisma.task.updateMany({
      where: {
        status: "DONE",
        OR: [
          { googleTaskKey },
          { runKey: googleTaskKey }, // legacy
          {
            AND: [
              { googleTaskListId: tasklistId },
              { googleTaskId: taskId },
            ],
          },
        ],
      },
      data: { status: "DOING" },
    });
  }

  revalidatePath("/board");
  revalidatePath("/tasks");
  revalidatePath("/g-tasks");
  if (missionControlTaskId) revalidatePath(`/tasks/${missionControlTaskId}`);

  redirect(safeReturnTo(formData, `/g-tasks?listId=${encodeURIComponent(tasklistId)}`));
}

export async function pushMissionControlTaskToGoogleTasks(
  missionControlTaskId: string,
  formData: FormData,
) {
  const tasklistId = String(formData.get("tasklistId") ?? "").trim();
  if (!tasklistId) throw new Error("tasklistId is required");

  const mcTask = await prisma.task.findUnique({
    where: { id: missionControlTaskId },
  });
  if (!mcTask) throw new Error("Mission Control task not found");

  const returnTo = safeReturnTo(formData, `/tasks/${missionControlTaskId}`);

  // If already linked, don’t create duplicates.
  if (mcTask.googleTaskKey) {
    redirect(returnTo);
  }

  const due = mcTask.dueAt ? mcTask.dueAt.toISOString() : undefined;

  const notesParts = [mcTask.description ?? ""].filter(Boolean);
  notesParts.push("", "---", `Mission Control task: ${mcTask.id}`);
  if (mcTask.source) notesParts.push(`source: ${mcTask.source}`);
  if (mcTask.runKey) notesParts.push(`runKey: ${mcTask.runKey}`);

  const created = await tasksAdd({
    tasklistId,
    title: mcTask.title,
    notes: notesParts.join("\n").trim() || undefined,
    due,
  });

  const googleTaskKey = `gtasks:${tasklistId}:${created.id}`;

  await prisma.task.update({
    where: { id: mcTask.id },
    data: {
      googleTaskKey,
      googleTaskListId: tasklistId,
      googleTaskId: created.id,
      googleTaskWebViewLink: created.webViewLink ?? null,
    },
  });

  revalidatePath("/board");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${missionControlTaskId}`);
  revalidatePath("/g-tasks");

  redirect(returnTo);
}
