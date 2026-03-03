import Link from "next/link";

import { createSketch } from "@/app/(app)/_actions/sketches";
import { getVaultRoot, listSketches } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default async function SketchesPage() {
  const sketches = await listSketches();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Sketches</h1>
          <p className="text-sm text-zinc-400">
            Excalidraw-style diagrams stored locally in your vault.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-400 lg:block">
            Vault: <span className="font-mono">{getVaultRoot()}</span>
          </div>

          <form action={createSketch}>
            <button
              type="submit"
              className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
            >
              New sketch
            </button>
          </form>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-zinc-800">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs font-medium text-zinc-300">
          <div className="col-span-8">ID</div>
          <div className="col-span-4">Updated</div>
        </div>

        {sketches.length === 0 ? (
          <div className="px-3 py-6 text-sm text-zinc-400">No sketches yet.</div>
        ) : null}

        <div className="divide-y divide-zinc-800">
          {sketches.map((s) => (
            <Link
              key={s.id}
              href={`/sketches/${encodeURIComponent(s.id)}`}
              className="grid grid-cols-12 items-center gap-2 px-3 py-3 text-sm hover:bg-zinc-900"
            >
              <div className="col-span-8 truncate font-mono text-xs text-zinc-200">
                {s.id}
              </div>
              <div className="col-span-4 text-xs text-zinc-500">
                {new Date(s.updatedAt).toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        Tip: link sketches from Markdown notes by pasting the URL (e.g. <span className="font-mono">/sketches/&lt;id&gt;</span>).
      </div>
    </div>
  );
}
