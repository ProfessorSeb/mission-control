"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";

type TaskHit = {
  id: string;
  title: string;
  status: string;
  priority: string;
};

function useCommandShortcut(setOpen: (v: boolean) => void) {
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isK = e.key.toLowerCase() === "k";
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        setOpen(true);
      }

      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [tasks, setTasks] = React.useState<TaskHit[]>([]);
  const [loading, setLoading] = React.useState(false);

  useCommandShortcut(setOpen);

  React.useEffect(() => {
    function onOpen() {
      setOpen(true);
    }

    window.addEventListener("mc:open-command-palette", onOpen);
    return () => window.removeEventListener("mc:open-command-palette", onOpen);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const q = query.trim();
    if (!q) {
      setTasks([]);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/tasks/search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as { tasks: TaskHit[] };
        if (!cancelled) setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      } catch {
        if (!cancelled) setTasks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // tiny debounce
    const t = window.setTimeout(run, 120);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(t);
    };
  }, [open, query]);

  function closeAnd(fn: () => void) {
    setOpen(false);
    setQuery("");
    setTasks([]);
    fn();
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-[18%] w-[92vw] max-w-xl -translate-x-1/2 rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>

          <Command className="w-full">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
              <span className="text-xs font-medium text-zinc-500">⌘K</span>
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Type a command or search tasks…"
                className="h-9 w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                autoFocus
              />
            </div>

            <Command.List className="max-h-[420px] overflow-auto p-2">
              <Command.Empty className="px-2 py-3 text-sm text-zinc-500">
                {loading ? "Searching…" : "No results"}
              </Command.Empty>

              <Command.Group heading="Navigate" className="px-1">
                <Command.Item
                  onSelect={() => closeAnd(() => router.push("/board"))}
                  className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                >
                  <span>Board</span>
                  <span className="text-xs text-zinc-500">G B</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => closeAnd(() => router.push("/tasks"))}
                  className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                >
                  <span>Tasks (list)</span>
                  <span className="text-xs text-zinc-500">G T</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => closeAnd(() => router.push("/notes"))}
                  className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                >
                  <span>Notes</span>
                  <span className="text-xs text-zinc-500">G N</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => closeAnd(() => router.push("/sketches"))}
                  className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                >
                  <span>Sketches</span>
                  <span className="text-xs text-zinc-500">G D</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => closeAnd(() => router.push("/openclaw"))}
                  className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                >
                  <span>OpenClaw workspace</span>
                  <span className="text-xs text-zinc-500">G O</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => closeAnd(() => router.push("/mail"))}
                  className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                >
                  <span>Mail</span>
                  <span className="text-xs text-zinc-500">G M</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => closeAnd(() => router.push("/g-tasks"))}
                  className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                >
                  <span>Google Tasks</span>
                  <span className="text-xs text-zinc-500">G G</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => closeAnd(() => router.push("/runs"))}
                  className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                >
                  <span>Runs</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => closeAnd(() => router.push("/sessions"))}
                  className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                >
                  <span>Sessions</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => closeAnd(() => router.push("/tasks/new"))}
                  className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                >
                  <span>New task</span>
                  <span className="text-xs text-zinc-500">C</span>
                </Command.Item>
              </Command.Group>

              {tasks.length > 0 ? (
                <Command.Group heading="Tasks" className="mt-2 px-1">
                  {tasks.map((t) => (
                    <Command.Item
                      key={t.id}
                      onSelect={() => closeAnd(() => router.push(`/tasks/${t.id}`))}
                      className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm text-zinc-200 aria-selected:bg-zinc-900"
                    >
                      <span className="min-w-0 truncate">{t.title}</span>
                      <span className="ml-3 shrink-0 text-xs text-zinc-500">
                        {t.priority} · {t.status}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}
            </Command.List>
          </Command>

          <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-3 py-2 text-xs text-zinc-500">
            <span>Enter to open · Esc to close</span>
            <button
              onClick={() => setOpen(false)}
              className="rounded px-2 py-1 hover:bg-zinc-900"
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
