import { getOpenClawSessions } from "@/lib/openclaw";

export default async function SessionsPage() {
  const sessions = await getOpenClawSessions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Sessions</h1>
        <p className="text-sm text-zinc-400">
          OpenClaw session index (from sessions.json).
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-zinc-800">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs font-medium text-zinc-300">
          <div className="col-span-6">Session key</div>
          <div className="col-span-3">Label</div>
          <div className="col-span-3">Updated</div>
        </div>

        {sessions.length === 0 ? (
          <div className="px-3 py-6 text-sm text-zinc-400">
            No sessions found (or OpenClaw home not readable).
          </div>
        ) : null}

        <div className="divide-y divide-zinc-800">
          {sessions.map((s) => (
            <div
              key={s.sessionKey}
              className="grid grid-cols-12 gap-2 px-3 py-3 text-xs"
            >
              <div className="col-span-6 min-w-0">
                <div className="truncate font-mono text-zinc-200">
                  {s.sessionKey}
                </div>
                <div className="truncate font-mono text-zinc-600">{s.sessionId}</div>
              </div>
              <div className="col-span-3 min-w-0 truncate text-zinc-400">
                {s.label ?? ""}
              </div>
              <div className="col-span-3 text-zinc-400">
                {s.updatedAt ? new Date(s.updatedAt).toLocaleString() : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
