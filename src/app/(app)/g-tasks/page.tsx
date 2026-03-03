import Link from "next/link";

import {
  addGoogleTask,
  markGoogleTaskDone,
  markGoogleTaskUndone,
} from "@/app/(app)/_actions/g-tasks";
import { createTaskFromGoogleTask } from "@/app/(app)/_actions/tasks";
import { prisma } from "@/lib/db";
import { tasksList, tasksListsList } from "@/lib/gog";

function toDateString(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default async function GoogleTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ listId?: string; showCompleted?: string }>;
}) {
  const sp = await searchParams;
  const requestedListId = typeof sp.listId === "string" ? sp.listId : "";
  const showCompleted =
    sp.showCompleted === "1" || sp.showCompleted === "true" || sp.showCompleted === "yes";

  let lists: Awaited<ReturnType<typeof tasksListsList>> = [];
  let tasks: Awaited<ReturnType<typeof tasksList>> = [];
  let error: string | null = null;

  try {
    lists = await tasksListsList();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load Google Task lists";
  }

  const activeListId = requestedListId || lists[0]?.id || "";

  if (!error && activeListId) {
    try {
      tasks = await tasksList({
        tasklistId: activeListId,
        showCompleted,
        max: 100,
      });
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load tasks";
    }
  }

  const baseQuery =
    activeListId ? `listId=${encodeURIComponent(activeListId)}` : "";
  const returnTo = `/g-tasks${baseQuery ? `?${baseQuery}${showCompleted ? "&showCompleted=1" : ""}` : ""}`;

  const runKeys =
    activeListId && tasks.length > 0
      ? tasks.map((t) => `gtasks:${activeListId}:${t.id}`)
      : [];

  const existing =
    runKeys.length > 0
      ? await prisma.task.findMany({
          where: { runKey: { in: runKeys } },
          select: { runKey: true },
        })
      : [];

  const existingSet = new Set(existing.map((t) => t.runKey).filter(Boolean));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Google Tasks</h1>
          <p className="text-sm text-zinc-400">
            View and create tasks via <span className="font-mono">gog tasks</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeListId ? (
            <Link
              href={`/g-tasks?listId=${encodeURIComponent(activeListId)}${showCompleted ? "" : "&showCompleted=1"}`}
              className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              {showCompleted ? "Hide completed" : "Show completed"}
            </Link>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-900/60 bg-red-950/20 px-4 py-3 text-sm text-red-200">
          {error}
          <div className="mt-2 text-xs text-red-200/80">
            Make sure <span className="font-mono">gog</span> is installed and you’ve run{" "}
            <span className="font-mono">gog login you@domain.com --services tasks</span>.
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="text-xs font-medium text-zinc-400">Task lists</div>
        <div className="flex flex-wrap gap-2">
          {lists.map((l) => {
            const href = `/g-tasks?listId=${encodeURIComponent(l.id)}${showCompleted ? "&showCompleted=1" : ""}`;
            const active = l.id === activeListId;

            return (
              <Link
                key={l.id}
                href={href}
                className={
                  "rounded-md border px-3 py-2 text-sm transition-colors " +
                  (active
                    ? "border-zinc-700 bg-zinc-100 text-zinc-950"
                    : "border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900")
                }
              >
                {l.title}
              </Link>
            );
          })}

          {lists.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-800 px-3 py-2 text-sm text-zinc-500">
              No task lists found.
            </div>
          ) : null}
        </div>
      </div>

      {activeListId ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-4">
            <h2 className="text-sm font-medium text-zinc-200">Create Google task</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Creates a task directly in Google Tasks (list: {lists.find((l) => l.id === activeListId)?.title ?? activeListId}).
            </p>

            <form action={addGoogleTask} className="mt-4 space-y-3">
              <input type="hidden" name="tasklistId" value={activeListId} />
              <input type="hidden" name="returnTo" value={returnTo} />

              <div className="space-y-2">
                <label className="text-xs text-zinc-400">Title</label>
                <input
                  name="title"
                  placeholder="e.g. Follow up with customer"
                  required
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-400">Notes (optional)</label>
                <textarea
                  name="notes"
                  rows={4}
                  className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="text-xs text-zinc-400">Due (optional)</label>
                  <input
                    name="due"
                    type="date"
                    className="mt-1 w-44 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
                >
                  Create
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-300">
            <div className="font-medium text-zinc-200">Board integration</div>
            <div className="mt-2 text-zinc-400">
              You can optionally import any Google Task into your Mission Control
              board as a local task (deduped).
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-md border border-zinc-800">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs font-medium text-zinc-300">
          <div className="col-span-1">State</div>
          <div className="col-span-6">Title</div>
          <div className="col-span-2">Due</div>
          <div className="col-span-2">Updated</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {tasks.length === 0 ? (
          <div className="px-3 py-6 text-sm text-zinc-400">No tasks.</div>
        ) : null}

        <div className="divide-y divide-zinc-800">
          {tasks.map((t) => {
            const imported = activeListId
              ? existingSet.has(`gtasks:${activeListId}:${t.id}`)
              : false;

            return (
              <div
                key={t.id}
                className="grid grid-cols-12 items-start gap-2 px-3 py-3 text-sm"
              >
                <div className="col-span-1 pt-0.5">
                  <span
                    className={
                      "inline-flex h-2 w-2 rounded-full " +
                      (t.status === "completed" ? "bg-emerald-400" : "bg-zinc-500")
                    }
                    title={t.status}
                  />
                </div>

                <div className="col-span-6 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-medium text-zinc-100">
                      {t.title}
                    </div>
                    {t.webViewLink ? (
                      <a
                        href={t.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Open
                      </a>
                    ) : null}
                  </div>
                  {t.notes ? (
                    <div className="mt-1 line-clamp-2 text-xs text-zinc-500">
                      {t.notes}
                    </div>
                  ) : null}
                  <div className="mt-1 truncate font-mono text-[11px] text-zinc-600">
                    {t.id}
                  </div>
                </div>

                <div className="col-span-2 text-xs text-zinc-400">
                  {t.due ? toDateString(t.due).slice(0, 10) : ""}
                </div>

                <div className="col-span-2 text-xs text-zinc-500">
                  {t.updated ? toDateString(t.updated) : ""}
                </div>

                <div className="col-span-1 flex flex-col items-end gap-2">
                  {t.status === "completed" ? (
                    <form action={markGoogleTaskUndone}>
                      <input type="hidden" name="tasklistId" value={activeListId} />
                      <input type="hidden" name="taskId" value={t.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button
                        type="submit"
                        className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
                      >
                        Undo
                      </button>
                    </form>
                  ) : (
                    <form action={markGoogleTaskDone}>
                      <input type="hidden" name="tasklistId" value={activeListId} />
                      <input type="hidden" name="taskId" value={t.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button
                        type="submit"
                        className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
                      >
                        Done
                      </button>
                    </form>
                  )}

                  {imported ? (
                    <span className="rounded bg-zinc-800 px-2 py-1 text-[11px] text-zinc-200">
                      Imported
                    </span>
                  ) : (
                    <form action={createTaskFromGoogleTask}>
                      <input type="hidden" name="tasklistId" value={activeListId} />
                      <input type="hidden" name="taskId" value={t.id} />
                      <input type="hidden" name="title" value={t.title} />
                      <input type="hidden" name="notes" value={t.notes ?? ""} />
                      <input type="hidden" name="due" value={t.due ?? ""} />
                      <input
                        type="hidden"
                        name="webViewLink"
                        value={t.webViewLink ?? ""}
                      />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button
                        type="submit"
                        className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
                        title="Import into Mission Control board"
                      >
                        + Board
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        Powered by <span className="font-mono">gog tasks</span>. This requires gog OAuth
        on the machine running Mission Control.
      </div>
    </div>
  );
}
