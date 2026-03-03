import fs from "node:fs/promises";
import path from "node:path";

import { getOpenClawHome } from "@/lib/openclaw";

export const dynamic = "force-dynamic";

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export default async function SettingsPage() {
  const openclawHome = getOpenClawHome();
  const sessionsPath = path.join(openclawHome, "agents", "main", "sessions", "sessions.json");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-400">Environment + integrations status.</p>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-4 text-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <div className="text-xs text-zinc-500">OPENCLAW_HOME</div>
            <div className="font-mono text-zinc-200">
              {process.env.OPENCLAW_HOME ?? "(default)"}
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Resolved OpenClaw home</div>
            <div className="font-mono text-zinc-200">{openclawHome}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs text-zinc-500">sessions.json</div>
          <div className="font-mono text-zinc-200">{sessionsPath}</div>
          <div className="mt-1 text-xs text-zinc-400">
            Readable: {(await exists(sessionsPath)) ? "yes" : "no"}
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        Note: This MVP reads OpenClaw data from local files. If you deploy this
        elsewhere (Vercel, k8s), we’ll want a small OpenClaw API proxy instead.
      </div>
    </div>
  );
}
