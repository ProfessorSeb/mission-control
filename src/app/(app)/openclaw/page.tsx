import Link from "next/link";

import {
  getOpenClawWorkspaceRoot,
  isOpenClawWorkspaceRoot,
  OPENCLAW_MANAGED_FILES,
} from "@/lib/openclaw-workspace";

export const dynamic = "force-dynamic";

export default async function OpenClawPage() {
  const root = getOpenClawWorkspaceRoot();
  const ok = isOpenClawWorkspaceRoot(root);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">OpenClaw Workspace</h1>
          <p className="text-sm text-zinc-400">
            Edit the core markdown files that control how your assistant behaves.
          </p>
        </div>

        <div
          className={
            "rounded-md border px-3 py-2 text-xs " +
            (ok
              ? "border-zinc-800 bg-zinc-900/30 text-zinc-400"
              : "border-amber-900/60 bg-amber-950/20 text-amber-200")
          }
        >
          Root: <span className="font-mono">{root}</span>
          <div className="mt-1">
            {ok ? "Detected" : "Not detected (set OPENCLAW_WORKSPACE_DIR)"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {OPENCLAW_MANAGED_FILES.map((f) => (
          <Link
            key={f.key}
            href={`/openclaw/${encodeURIComponent(f.key)}`}
            className="rounded-md border border-zinc-800 bg-zinc-900/30 p-4 hover:bg-zinc-900/50"
          >
            <div className="text-sm font-medium text-zinc-100">{f.label}</div>
            <div className="mt-1 text-xs text-zinc-400">{f.description}</div>
            <div className="mt-2 font-mono text-[11px] text-zinc-600">
              {f.relPath}
            </div>
          </Link>
        ))}
      </div>

      <div className="text-xs text-zinc-500">
        Tip: if you expose Mission Control publicly (ngrok), enable the auth gate
        first (MC_AUTH_PASSWORD).
      </div>
    </div>
  );
}
