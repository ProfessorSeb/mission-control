import Link from "next/link";

import { createTask } from "@/app/(app)/_actions/tasks";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/task";

export default function NewTaskPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">New Task</h1>
          <p className="text-sm text-zinc-400">
            Add a work item to your Mission Control board.
          </p>
        </div>

        <Link
          href="/board"
          className="rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
        >
          Back
        </Link>
      </div>

      <form action={createTask} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-zinc-200">Title</label>
          <input
            name="title"
            required
            placeholder="e.g. Build Mission Control MVP"
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-200">Description</label>
          <textarea
            name="description"
            rows={6}
            placeholder="Optional notes…"
            className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-600"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm text-zinc-200">Status</label>
            <select
              name="status"
              defaultValue="INBOX"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-200">Priority</label>
            <select
              name="priority"
              defaultValue="P2"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-200">Due (optional)</label>
            <input
              name="dueAt"
              type="datetime-local"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href="/board"
            className="rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
          >
            Create Task
          </button>
        </div>
      </form>
    </div>
  );
}
