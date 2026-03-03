import Link from "next/link";
import { notFound } from "next/navigation";

import {
  markGoogleTaskDone,
  markGoogleTaskUndone,
  pushMissionControlTaskToGoogleTasks,
} from "@/app/(app)/_actions/g-tasks";
import { deleteTask, updateTask } from "@/app/(app)/_actions/tasks";
import { prisma } from "@/lib/db";
import { tasksListsList } from "@/lib/gog";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/task";

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: { taskId: string };
  searchParams: Promise<{ gsync?: string }>;
}) {
  const sp = await searchParams;
  const gsyncFailed = sp.gsync === "failed";

  const task = await prisma.task.findUnique({ where: { id: params.taskId } });
  if (!task) notFound();

  const updateAction = updateTask.bind(null, task.id);
  const deleteAction = deleteTask.bind(null, task.id);
  const pushAction = pushMissionControlTaskToGoogleTasks.bind(null, task.id);

  let taskLists: Awaited<ReturnType<typeof tasksListsList>> = [];
  let taskListsError: string | null = null;
  try {
    taskLists = await tasksListsList();
  } catch (e) {
    taskListsError = e instanceof Error ? e.message : "Failed to load Google Task lists";
  }

  const returnTo = `/tasks/${task.id}`;
  const linkedList = task.googleTaskListId
    ? taskLists.find((l) => l.id === task.googleTaskListId)
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {gsyncFailed ? (
        <div className="rounded-md border border-amber-900/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
          Google Tasks sync failed. Make sure <span className="font-mono">gog</span> is logged in with the <span className="font-mono">tasks</span> scope, then hit Save again.
        </div>
      ) : null}
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

      <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-zinc-200">Google Tasks</div>
            <div className="text-xs text-zinc-500">
              {task.googleTaskKey ? "Linked" : "Not linked"}
            </div>
          </div>

          {task.googleTaskWebViewLink ? (
            <a
              href={task.googleTaskWebViewLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
            >
              Open
            </a>
          ) : null}
        </div>

        {taskListsError ? (
          <div className="mt-3 rounded-md border border-red-900/60 bg-red-950/20 px-3 py-2 text-xs text-red-200">
            {taskListsError}
          </div>
        ) : null}

        {task.googleTaskKey ? (
          <div className="mt-3 space-y-3">
            <div className="text-xs text-zinc-400">
              List: <span className="font-mono">{task.googleTaskListId ?? ""}</span>
              {linkedList ? (
                <span className="text-zinc-500"> · {linkedList.title}</span>
              ) : null}
            </div>
            <div className="text-xs text-zinc-400">
              Task: <span className="font-mono">{task.googleTaskId ?? ""}</span>
            </div>

            {task.googleTaskListId && task.googleTaskId ? (
              <div className="flex items-center gap-2">
                {task.status === "DONE" ? (
                  <form action={markGoogleTaskUndone}>
                    <input
                      type="hidden"
                      name="tasklistId"
                      value={task.googleTaskListId}
                    />
                    <input type="hidden" name="taskId" value={task.googleTaskId} />
                    <input
                      type="hidden"
                      name="missionControlTaskId"
                      value={task.id}
                    />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button
                      type="submit"
                      className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                    >
                      Mark undone
                    </button>
                  </form>
                ) : (
                  <form action={markGoogleTaskDone}>
                    <input
                      type="hidden"
                      name="tasklistId"
                      value={task.googleTaskListId}
                    />
                    <input type="hidden" name="taskId" value={task.googleTaskId} />
                    <input
                      type="hidden"
                      name="missionControlTaskId"
                      value={task.id}
                    />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button
                      type="submit"
                      className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                    >
                      Mark done
                    </button>
                  </form>
                )}

                <div className="text-xs text-zinc-500">
                  (Uses <span className="font-mono">gog tasks done/undo</span>)
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <form action={pushAction} className="mt-3 space-y-3">
            <input type="hidden" name="returnTo" value={returnTo} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-zinc-400">Task list</label>
                <select
                  name="tasklistId"
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                  defaultValue={taskLists[0]?.id}
                  required
                >
                  {taskLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="text-xs text-zinc-400">Due</label>
                <div className="mt-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
                  {task.dueAt ? task.dueAt.toISOString().slice(0, 10) : "(none)"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-500">
                Creates a Google Task from this Mission Control task.
              </div>
              <button
                type="submit"
                className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
                disabled={taskLists.length === 0}
              >
                Create Google Task
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-4 text-xs text-zinc-400">
        <div>Created: {task.createdAt.toISOString()}</div>
        <div>Updated: {task.updatedAt.toISOString()}</div>
      </div>
    </div>
  );
}
