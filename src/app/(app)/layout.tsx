import Link from "next/link";

import { NavLink } from "@/components/nav-link";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 px-3 py-4">
        <div className="px-3 pb-4">
          <div className="text-sm font-semibold tracking-wide text-zinc-100">
            Mission Control
          </div>
          <div className="text-xs text-zinc-400">OpenClaw ops dashboard</div>
        </div>

        <nav className="flex flex-col gap-1">
          <NavLink href="/board" label="Board" />
          <NavLink href="/mail" label="Mail" />
          <NavLink href="/runs" label="Runs" />
          <NavLink href="/sessions" label="Sessions" />
          <NavLink href="/tools" label="Tools" />
          <NavLink href="/settings" label="Settings" />
        </nav>

        <div className="mt-6 px-3 text-xs text-zinc-500">
          <div className="truncate">Host: {process.env.HOSTNAME}</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-4">
          <form action="/board" className="flex flex-1 items-center">
            <input
              name="q"
              placeholder="Search tasks…"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-600"
            />
          </form>

          <div className="flex items-center gap-2">
            <Link
              href="/tasks/new"
              className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
            >
              New Task
            </Link>
          </div>
        </header>

        <main className="flex-1 min-w-0 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
