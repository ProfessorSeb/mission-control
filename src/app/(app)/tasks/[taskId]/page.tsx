import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteTask, updateTask } from "@/app/(app)/_actions/tasks";
import { prisma } from "@/lib/db";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/task";

export default async function TaskDetailPage({
  params,
}: {
  params: { taskId: string };
}) {
  const task = await prisma.task.findUnique({ where: { id: params.taskId } });
  if (!task) notFound();

  const updateAction = updateTask.bind(null, task.id);
  const deleteAction = deleteTask.bind(null, task.id);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Edit Task</h1>
          <p className="text-sm text-zinc-400">
            {task.source ? `source:${task.source}` : "manual"}
            {task.runKey ? ` · runKey:${task.runKey}` : ""}
          </p>
        </div>

        <Link
          href="/board"
          className="rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
        >
          Back
        </Link>
      </div>

      <form action={updateAction} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-zinc-200">Title</label>
          <input
            name="title"
            required
            defaultValue={task.title}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-200">Description</label>
          <textarea
            name="description"
            rows={8}
            defaultValue={task.description ?? ""}
            className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-600"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm text-zinc-200">Status</label>
            <select
              name="status"
              defaultValue={task.status}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-200">Priority</label>
            <select
              name="priority"
              defaultValue={task.priority}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-200">Due (optional)</label>
            <input
              name="dueAt"
              type="datetime-local"
              defaultValue={
                task.dueAt
                  ? new Date(task.dueAt.getTime() - task.dueAt.getTimezoneOffset() * 60_000)
                      .toISOString()
                      .slice(0, 16)
                  : ""
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            type="submit"
            formAction={deleteAction}
            className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-200 hover:bg-red-950/50"
          >
            Delete
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/board"
              className="rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
            >
              Save
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-4 text-xs text-zinc-400">
        <div>Created: {task.createdAt.toISOString()}</div>
        <div>Updated: {task.updatedAt.toISOString()}</div>
      </div>
    </div>
  );
}
