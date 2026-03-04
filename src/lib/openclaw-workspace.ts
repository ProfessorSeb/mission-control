import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

export type OpenClawFileKey =
  | "soul"
  | "heartbeat"
  | "user"
  | "tools"
  | "memory"
  | "agents"
  | "identity";

export type OpenClawManagedFile = {
  key: OpenClawFileKey;
  label: string;
  relPath: string; // relative to workspace root
  description: string;
};

export const OPENCLAW_MANAGED_FILES: OpenClawManagedFile[] = [
  {
    key: "soul",
    label: "SOUL.md",
    relPath: "SOUL.md",
    description: "Assistant persona + behavior rules.",
  },
  {
    key: "heartbeat",
    label: "HEARTBEAT.md",
    relPath: "HEARTBEAT.md",
    description: "What to do during heartbeat checks.",
  },
  {
    key: "user",
    label: "USER.md",
    relPath: "USER.md",
    description: "Your preferences + context (what to call you, timezone, etc.).",
  },
  {
    key: "tools",
    label: "TOOLS.md",
    relPath: "TOOLS.md",
    description: "Local environment notes (no secrets).",
  },
  {
    key: "memory",
    label: "MEMORY.md",
    relPath: "MEMORY.md",
    description: "Curated long-term memory.",
  },
  {
    key: "agents",
    label: "AGENTS.md",
    relPath: "AGENTS.md",
    description: "Workspace conventions + rules.",
  },
  {
    key: "identity",
    label: "IDENTITY.md",
    relPath: "IDENTITY.md",
    description: "Assistant identity metadata.",
  },
];

function hasFile(p: string): boolean {
  try {
    return fsSync.existsSync(p);
  } catch {
    return false;
  }
}

export function getOpenClawWorkspaceRoot(): string {
  const env =
    process.env.OPENCLAW_WORKSPACE_DIR ??
    process.env.MC_OPENCLAW_WORKSPACE_DIR ??
    process.env.MISSION_CONTROL_WORKSPACE_DIR ??
    "";
  if (env) return env;

  // In Sebby's layout the repo lives in: <workspace>/repos/mission-control
  // so 2 levels up is the OpenClaw workspace root.
  const candidate = path.resolve(process.cwd(), "..", "..");
  return candidate;
}

export function isOpenClawWorkspaceRoot(root: string): boolean {
  return hasFile(path.join(root, "AGENTS.md"));
}

function ensureInRoot(root: string, rel: string): string {
  const cleaned = rel.replace(/\\/g, "/");
  const abs = path.resolve(root, cleaned);
  const rootAbs = path.resolve(root);

  const prefix = rootAbs.endsWith(path.sep) ? rootAbs : rootAbs + path.sep;
  if (abs !== rootAbs && !abs.startsWith(prefix)) {
    throw new Error("Invalid path");
  }

  return abs;
}

export function getManagedFile(key: string): OpenClawManagedFile | null {
  return (
    OPENCLAW_MANAGED_FILES.find((f) => f.key === key) ??
    null
  );
}

export async function readManagedFile(key: OpenClawFileKey): Promise<string> {
  const root = getOpenClawWorkspaceRoot();
  if (!isOpenClawWorkspaceRoot(root)) {
    throw new Error(
      "OpenClaw workspace root not detected. Set OPENCLAW_WORKSPACE_DIR.",
    );
  }

  const f = OPENCLAW_MANAGED_FILES.find((x) => x.key === key);
  if (!f) throw new Error("Unknown file");

  const abs = ensureInRoot(root, f.relPath);
  return fs.readFile(abs, "utf8");
}

export async function writeManagedFile(key: OpenClawFileKey, content: string) {
  const root = getOpenClawWorkspaceRoot();
  if (!isOpenClawWorkspaceRoot(root)) {
    throw new Error(
      "OpenClaw workspace root not detected. Set OPENCLAW_WORKSPACE_DIR.",
    );
  }

  const f = OPENCLAW_MANAGED_FILES.find((x) => x.key === key);
  if (!f) throw new Error("Unknown file");

  const abs = ensureInRoot(root, f.relPath);
  await fs.writeFile(abs, content, "utf8");
}
