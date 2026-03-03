import { createTaskFromRun } from "@/app/(app)/_actions/tasks";
import { prisma } from "@/lib/db";
import { getOpenClawRuns } from "@/lib/openclaw";

export default async function RunsPage() {
  const runs = await getOpenClawRuns({ limit: 100, sessionLimit: 15 });

  const existing =
    runs.length > 0
      ? await prisma.task.findMany({
          where: { runKey: { in: runs.map((r) => r.runKey) } },
          select: { runKey: true },
        })
      : [];

  const existingSet = new Set(existing.map((t) => t.runKey).filter(Boolean));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Runs</h1>
        <p className="text-sm text-zinc-400">
          Detected sub-agent spawns from OpenClaw session logs.
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-zinc-800">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs font-medium text-zinc-300">
          <div className="col-span-4">Label</div>
          <div className="col-span-3">Session</div>
          <div className="col-span-2">When</div>
          <div className="col-span-2">Details</div>
          <div className="col-span-1 text-right">Task</div>
        </div>

        {runs.length === 0 ? (
          <div className="px-3 py-6 text-sm text-zinc-400">No runs found.</div>
        ) : null}

        <div className="divide-y divide-zinc-800">
          {runs.map((r) => {
            const imported = existingSet.has(r.runKey);

            return (
              <div
                key={r.runKey}
                className="grid grid-cols-12 items-center gap-2 px-3 py-3 text-sm"
              >
                <div className="col-span-4 min-w-0">
                  <div className="truncate font-medium text-zinc-100">
                    {r.label ?? "(no label)"}
                  </div>
                  <div className="truncate text-xs text-zinc-500">
                    {r.task ? r.task.replace(/\s+/g, " ") : ""}
                  </div>
                </div>

                <div className="col-span-3 min-w-0 text-xs text-zinc-400">
                  <div className="truncate">{r.sessionKey}</div>
                  <div className="truncate text-zinc-600">{r.toolCallId}</div>
                </div>

                <div className="col-span-2 text-xs text-zinc-400">
                  {r.timestamp ? new Date(r.timestamp).toLocaleString() : ""}
                </div>

                <div className="col-span-2 min-w-0 text-xs text-zinc-400">
                  <div className="truncate">{r.mode ?? ""}</div>
                  <div className="truncate text-zinc-600">{r.model ?? ""}</div>
                  <div className="mt-1 truncate text-zinc-600">
                    {typeof r.success === "boolean"
                      ? r.success
                        ? "spawn: ok"
                        : "spawn: failed"
                      : "spawn: ?"}
                    {r.runId ? ` · ${r.runId}` : ""}
                  </div>
                </div>

                <div className="col-span-1 flex justify-end">
                  {imported ? (
                    <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200">
                      Imported
                    </span>
                  ) : (
                    <form action={createTaskFromRun}>
                      <input type="hidden" name="runKey" value={r.runKey} />
                      <input
                        type="hidden"
                        name="runLabel"
                        value={r.label ?? "OpenClaw run"}
                      />
                      <input type="hidden" name="runTask" value={r.task ?? ""} />
                      <button
                        type="submit"
                        className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
                        title="Create task from this run"
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

      <div className="text-xs text-zinc-500">
        <div>
          Tip: set <span className="font-mono">OPENCLAW_HOME</span> if you run
          this dashboard somewhere other than the OpenClaw host.
        </div>
      </div>
    </div>
  );
}
