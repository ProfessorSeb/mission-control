import Link from "next/link";

import { prisma } from "@/lib/db";
import { TASK_STATUSES } from "@/lib/task";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const sp = await searchParams;
  const q = typeof sp?.q === "string" ? sp.q.trim() : "";

  const tasks = await prisma.task.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : undefined,
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Task Board</h1>
          <p className="text-sm text-zinc-400">
            Track everything: ACP sessions, sub-agents, and human tasks.
          </p>
        </div>

        {q ? (
          <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
            Filter: <span className="font-medium">{q}</span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {TASK_STATUSES.map(({ key, label }) => {
          const col = tasks.filter((t) => t.status === key);
          return (
            <section key={key} className="min-w-0">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-200">{label}</h2>
                <span className="text-xs text-zinc-500">{col.length}</span>
              </div>

              <div className="space-y-2">
                {col.length === 0 ? (
                  <div className="rounded-md border border-dashed border-zinc-800 px-3 py-3 text-xs text-zinc-500">
                    Empty
                  </div>
                ) : null}

                {col.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block rounded-md border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-zinc-100">
                          {task.title}
                        </div>
                        {task.description ? (
                          <div className="mt-1 line-clamp-2 text-xs text-zinc-400">
                            {task.description}
                          </div>
                        ) : null}
                      </div>

                      <div className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200">
                        {task.priority}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>
                        {task.source ? `source:${task.source}` : "manual"}
                      </span>
                      <span>{task.updatedAt.toISOString().slice(0, 10)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
