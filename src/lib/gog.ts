import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type GmailThreadSummary = {
  id: string;
  date: string;
  from: string;
  subject: string;
  labels: string[];
  messageCount: number;
};

export type GoogleTaskList = {
  id: string;
  title: string;
  updated?: string;
};

export type GoogleTask = {
  id: string;
  title: string;
  status: "needsAction" | "completed" | string;
  notes?: string;
  due?: string;
  updated?: string;
  completed?: string;
  webViewLink?: string;
};

async function runGogJson<T>(args: string[]): Promise<T> {
  const { stdout } = await execFileAsync("gog", args, {
    env: {
      ...process.env,
      NO_COLOR: "1",
    },
    maxBuffer: 10 * 1024 * 1024,
  });

  return JSON.parse(stdout) as T;
}

export async function getDefaultGogAccountEmail(): Promise<string | null> {
  const fromEnv =
    process.env.GOG_ACCOUNT ??
    process.env.GOOGLE_ACCOUNT ??
    process.env.GMAIL_ACCOUNT;
  if (fromEnv) return fromEnv;

  try {
    const status = await runGogJson<{
      account?: { email?: string };
    }>(["auth", "status", "-j", "--results-only"]);

    return status.account?.email ?? null;
  } catch {
    return null;
  }
}

export async function gmailSearchThreads({
  query,
  max = 10,
  account,
}: {
  query: string;
  max?: number;
  account?: string;
}): Promise<GmailThreadSummary[]> {
  const acct = account ?? (await getDefaultGogAccountEmail());
  if (!acct) throw new Error("No Gmail account configured for gog");

  const res = await runGogJson<GmailThreadSummary[]>([
    "gmail",
    "search",
    query,
    "--max",
    String(max),
    "-a",
    acct,
    "-j",
    "--results-only",
  ]);

  return Array.isArray(res) ? res : [];
}

export async function tasksListsList({
  account,
}: {
  account?: string;
} = {}): Promise<GoogleTaskList[]> {
  const acct = account ?? (await getDefaultGogAccountEmail());
  if (!acct) throw new Error("No Google account configured for gog");

  const res = await runGogJson<Array<Record<string, unknown>>>([
    "tasks",
    "lists",
    "list",
    "--max",
    "100",
    "-a",
    acct,
    "-j",
    "--results-only",
    "--no-input",
  ]);

  if (!Array.isArray(res)) return [];
  return res
    .map((r) => ({
      id: String(r.id ?? ""),
      title: String(r.title ?? ""),
      updated: typeof r.updated === "string" ? (r.updated as string) : undefined,
    }))
    .filter((r) => r.id && r.title);
}

export async function tasksList({
  tasklistId,
  showCompleted = false,
  max = 100,
  account,
}: {
  tasklistId: string;
  showCompleted?: boolean;
  max?: number;
  account?: string;
}): Promise<GoogleTask[]> {
  const acct = account ?? (await getDefaultGogAccountEmail());
  if (!acct) throw new Error("No Google account configured for gog");

  const args = [
    "tasks",
    "list",
    tasklistId,
    "--max",
    String(Math.max(1, Math.min(100, max))),
    "-a",
    acct,
    "-j",
    "--results-only",
    "--no-input",
  ];

  if (showCompleted) {
    args.push("--show-completed");
    args.push("--show-hidden");
  }

  const res = await runGogJson<Array<Record<string, unknown>>>(args);
  if (!Array.isArray(res)) return [];

  return res
    .map((r) => ({
      id: String(r.id ?? ""),
      title: String(r.title ?? ""),
      status: String(r.status ?? "needsAction"),
      notes: typeof r.notes === "string" ? (r.notes as string) : undefined,
      due: typeof r.due === "string" ? (r.due as string) : undefined,
      updated: typeof r.updated === "string" ? (r.updated as string) : undefined,
      completed:
        typeof r.completed === "string" ? (r.completed as string) : undefined,
      webViewLink:
        typeof r.webViewLink === "string" ? (r.webViewLink as string) : undefined,
    }))
    .filter((t) => t.id && t.title);
}

export async function tasksAdd({
  tasklistId,
  title,
  notes,
  due,
  account,
}: {
  tasklistId: string;
  title: string;
  notes?: string;
  due?: string;
  account?: string;
}): Promise<GoogleTask> {
  const acct = account ?? (await getDefaultGogAccountEmail());
  if (!acct) throw new Error("No Google account configured for gog");

  const args = [
    "tasks",
    "add",
    tasklistId,
    "--title",
    title,
    "-a",
    acct,
    "-j",
    "--results-only",
    "--no-input",
  ];

  if (notes) args.push("--notes", notes);
  if (due) args.push("--due", due);

  const r = await runGogJson<Record<string, unknown>>(args);
  return {
    id: String(r.id ?? ""),
    title: String(r.title ?? title),
    status: String(r.status ?? "needsAction"),
    notes: typeof r.notes === "string" ? (r.notes as string) : undefined,
    due: typeof r.due === "string" ? (r.due as string) : undefined,
    updated: typeof r.updated === "string" ? (r.updated as string) : undefined,
    completed: typeof r.completed === "string" ? (r.completed as string) : undefined,
    webViewLink:
      typeof r.webViewLink === "string" ? (r.webViewLink as string) : undefined,
  };
}

export async function tasksDone({
  tasklistId,
  taskId,
  account,
}: {
  tasklistId: string;
  taskId: string;
  account?: string;
}) {
  const acct = account ?? (await getDefaultGogAccountEmail());
  if (!acct) throw new Error("No Google account configured for gog");

  await runGogJson<Record<string, unknown>>([
    "tasks",
    "done",
    tasklistId,
    taskId,
    "-a",
    acct,
    "-j",
    "--results-only",
    "--no-input",
  ]);
}

export async function tasksUndo({
  tasklistId,
  taskId,
  account,
}: {
  tasklistId: string;
  taskId: string;
  account?: string;
}) {
  const acct = account ?? (await getDefaultGogAccountEmail());
  if (!acct) throw new Error("No Google account configured for gog");

  await runGogJson<Record<string, unknown>>([
    "tasks",
    "undo",
    tasklistId,
    taskId,
    "-a",
    acct,
    "-j",
    "--results-only",
    "--no-input",
  ]);
}
