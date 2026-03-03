import { createEmailWatch, deleteEmailWatch, toggleEmailWatch } from "@/app/(app)/_actions/email";
import { createTaskFromEmail } from "@/app/(app)/_actions/tasks";
import { prisma } from "@/lib/db";
import { gmailSearchThreads } from "@/lib/gog";

export default async function MailPage() {
  const watches = await prisma.emailWatch.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });

  const enabled = watches.filter((w) => w.enabled);

  const results = await Promise.all(
    enabled.map(async (w) => {
      try {
        const threads = await gmailSearchThreads({
          query: w.query,
          max: w.maxResults,
        });
        return { watch: w, threads, error: null as string | null };
      } catch (e) {
        return {
          watch: w,
          threads: [],
          error: e instanceof Error ? e.message : "Failed to load",
        };
      }
    }),
  );

  const allThreadIds = results.flatMap((r) => r.threads.map((t) => t.id));
  const existing =
    allThreadIds.length > 0
      ? await prisma.task.findMany({
          where: {
            runKey: { in: allThreadIds.map((id) => `gmail:${id}`) },
          },
          select: { runKey: true },
        })
      : [];

  const existingSet = new Set(existing.map((t) => t.runKey).filter(Boolean));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Mail watch</h1>
        <p className="text-sm text-zinc-400">
          Track emails from specific senders/domains using Gmail query syntax.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-4">
            <h2 className="text-sm font-medium text-zinc-200">Add watch</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Examples: <span className="font-mono">from:alice@acme.com</span>,{" "}
              <span className="font-mono">from:acme.com newer_than:14d</span>,{" "}
              <span className="font-mono">from:(bob@a.com OR bob@b.com) is:unread</span>
            </p>

            <form action={createEmailWatch} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="text-xs text-zinc-400">Name</label>
                  <input
                    name="name"
                    placeholder="e.g. Clients"
                    className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-zinc-400">Query</label>
                  <input
                    name="query"
                    placeholder="from:example.com is:unread newer_than:7d"
                    className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="text-xs text-zinc-400">Max</label>
                  <input
                    name="maxResults"
                    type="number"
                    min={1}
                    max={50}
                    defaultValue={10}
                    className="mt-1 w-24 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
                >
                  Add
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-md border border-zinc-800 overflow-hidden">
            <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs font-medium text-zinc-300">
              Watches
            </div>
            <div className="divide-y divide-zinc-800">
              {watches.length === 0 ? (
                <div className="px-4 py-6 text-sm text-zinc-400">No watches yet.</div>
              ) : null}
              {watches.map((w) => (
                <div key={w.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-zinc-100">
                        {w.name}
                      </div>
                      <div className="mt-1 truncate font-mono text-xs text-zinc-500">
                        {w.query}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <form action={toggleEmailWatch}>
                        <input type="hidden" name="id" value={w.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
                        >
                          {w.enabled ? "Disable" : "Enable"}
                        </button>
                      </form>
                      <form action={deleteEmailWatch}>
                        <input type="hidden" name="id" value={w.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-red-900/60 bg-red-950/30 px-2 py-1 text-xs text-red-200 hover:bg-red-950/50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-zinc-600">
                    {w.enabled ? "enabled" : "disabled"} · max {w.maxResults}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-300">
            This view uses the local <span className="font-mono">gog</span> CLI to query Gmail.
            Run it on the same machine where you’ve authenticated <span className="font-mono">gog login</span>.
          </div>

          {results.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-800 px-4 py-8 text-sm text-zinc-500">
              No enabled watches.
            </div>
          ) : null}

          <div className="space-y-6">
            {results.map(({ watch, threads, error }) => (
              <section key={watch.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-zinc-200">
                    {watch.name}
                  </h2>
                  <span className="text-xs text-zinc-500">{threads.length}</span>
                </div>

                {error ? (
                  <div className="rounded-md border border-red-900/60 bg-red-950/20 px-3 py-2 text-xs text-red-200">
                    {error}
                  </div>
                ) : null}

                <div className="overflow-hidden rounded-md border border-zinc-800">
                  <div className="grid grid-cols-12 gap-2 border-b border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs font-medium text-zinc-300">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-4">From</div>
                    <div className="col-span-5">Subject</div>
                    <div className="col-span-1 text-right">Task</div>
                  </div>

                  {threads.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-zinc-500">Empty</div>
                  ) : null}

                  <div className="divide-y divide-zinc-800">
                    {threads.map((t) => {
                      const key = `gmail:${t.id}`;
                      const imported = existingSet.has(key);

                      return (
                        <div
                          key={t.id}
                          className="grid grid-cols-12 items-center gap-2 px-3 py-3 text-xs"
                        >
                          <div className="col-span-2 text-zinc-400">{t.date}</div>
                          <div className="col-span-4 min-w-0 truncate text-zinc-300">
                            {t.from}
                          </div>
                          <div className="col-span-5 min-w-0">
                            <div className="truncate text-zinc-100">
                              {t.subject || "(no subject)"}
                            </div>
                            <div className="mt-1 truncate font-mono text-[11px] text-zinc-600">
                              {t.id} · {t.labels?.join(", ")}
                            </div>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            {imported ? (
                              <span className="rounded bg-zinc-800 px-2 py-1 text-[11px] text-zinc-200">
                                Imported
                              </span>
                            ) : (
                              <form action={createTaskFromEmail}>
                                <input type="hidden" name="threadId" value={t.id} />
                                <input type="hidden" name="from" value={t.from} />
                                <input type="hidden" name="subject" value={t.subject} />
                                <input type="hidden" name="date" value={t.date} />
                                <button
                                  type="submit"
                                  className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-900"
                                >
                                  + Task
                                </button>
                              </form>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
