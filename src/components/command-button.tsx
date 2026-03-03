"use client";

export function CommandButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("mc:open-command-palette"))}
      className="hidden items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 md:flex"
      title="Command palette (Ctrl/Cmd + K)"
    >
      <span className="text-zinc-300">Search</span>
      <span className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-[11px] text-zinc-400">
        ⌘K
      </span>
    </button>
  );
}
