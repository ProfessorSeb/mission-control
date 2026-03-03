import Link from "next/link";

import { prisma } from "@/lib/db";

export default async function TasksListPage({
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
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Tasks</h1>
          <p className="text-sm text-zinc-400">Linear-style list view.</p>
        </div>

        {q ? (
          <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
            Filter: <span className="font-medium">{q}</span>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-md border border-zinc-800">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs font-medium text-zinc-300">
          <div className="col-span-6">Title</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Pri</div>
          <div className="col-span-3">Updated</div>
        </div>

        {tasks.length === 0 ? (
          <div className="px-3 py-6 text-sm text-zinc-400">No tasks.</div>
        ) : null}

        <div className="divide-y divide-zinc-800">
          {tasks.map((t) => (
            <Link
              key={t.id}
              href={`/tasks/${t.id}`}
              className="grid grid-cols-12 items-center gap-2 px-3 py-3 text-sm hover:bg-zinc-900"
            >
              <div className="col-span-6 min-w-0">
                <div className="truncate font-medium text-zinc-100">
                  {t.title}
                </div>
                {t.description ? (
                  <div className="mt-1 line-clamp-1 text-xs text-zinc-500">
                    {t.description}
                  </div>
                ) : null}
              </div>

              <div className="col-span-2 text-xs text-zinc-400">{t.status}</div>
              <div className="col-span-1 text-xs text-zinc-300">{t.priority}</div>
              <div className="col-span-3 text-xs text-zinc-500">
                {t.updatedAt.toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
