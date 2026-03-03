import Link from "next/link";

import { createNote } from "@/app/(app)/_actions/notes";
import { getVaultRoot, listNotes } from "@/lib/vault";

export const dynamic = "force-dynamic";

function noteHref(relPath: string): string {
  const clean = relPath.replace(/\\/g, "/").replace(/^\//, "");
  const parts = clean.split("/").map(encodeURIComponent);
  return `/notes/${parts.join("/")}`;
}

export default async function NotesPage() {
  const notes = await listNotes();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Notes</h1>
          <p className="text-sm text-zinc-400">
            Markdown knowledge base (customers, projects, tech, show notes).
          </p>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-400">
          Vault: <span className="font-mono">{getVaultRoot()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-4">
          <h2 className="text-sm font-medium text-zinc-200">Create note</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Stored outside the repo at <span className="font-mono">vault/notes</span>.
          </p>

          <form action={createNote} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="text-xs text-zinc-400">Folder</label>
                <select
                  name="folder"
                  defaultValue="projects"
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                >
                  <option value="customers">customers</option>
                  <option value="projects">projects</option>
                  <option value="tech">tech</option>
                  <option value="shows">shows</option>
                  <option value="misc">misc</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-zinc-400">Title</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. 407etr - BIG-IP Sentinel CEF"
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
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
          <div className="font-medium text-zinc-200">Tips</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-400">
            <li>Use frontmatter: <span className="font-mono">title</span>, tags, customer, project, etc.</li>
            <li>Link sketches by pasting the Sketch URL (e.g. <span className="font-mono">/sketches/&lt;id&gt;</span>).</li>
            <li>Everything is just files: easy to back up or grep.</li>
          </ul>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-zinc-800">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs font-medium text-zinc-300">
          <div className="col-span-6">Title</div>
          <div className="col-span-4">Path</div>
          <div className="col-span-2">Updated</div>
        </div>

        {notes.length === 0 ? (
          <div className="px-3 py-6 text-sm text-zinc-400">No notes yet.</div>
        ) : null}

        <div className="divide-y divide-zinc-800">
          {notes.map((n) => (
            <Link
              key={n.relPath}
              href={noteHref(n.relPath)}
              className="grid grid-cols-12 items-center gap-2 px-3 py-3 text-sm hover:bg-zinc-900"
            >
              <div className="col-span-6 min-w-0">
                <div className="truncate font-medium text-zinc-100">{n.title}</div>
              </div>
              <div className="col-span-4 min-w-0 truncate font-mono text-xs text-zinc-500">
                {n.relPath}
              </div>
              <div className="col-span-2 text-xs text-zinc-500">
                {new Date(n.updatedAt).toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
