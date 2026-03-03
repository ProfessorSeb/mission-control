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
