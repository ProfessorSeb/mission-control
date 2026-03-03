import fs from "node:fs/promises";
import fsSync from "node:fs";
import os from "node:os";
import path from "node:path";

import matter from "gray-matter";

export type VaultNote = {
  relPath: string; // path under notes/
  title: string;
  updatedAt: number;
};

export type VaultSketch = {
  id: string;
  fileName: string;
  updatedAt: number;
};

function hasFile(p: string): boolean {
  try {
    return fsSync.existsSync(p);
  } catch {
    return false;
  }
}

function getWorkspaceRootFromCwd(): string | null {
  // In Sebby's setup the repo lives in: <workspace>/repos/mission-control
  // We try to detect that by walking up 2 levels and checking for AGENTS.md.
  const candidate = path.resolve(process.cwd(), "..", "..");
  if (hasFile(path.join(candidate, "AGENTS.md"))) return candidate;
  return null;
}

export function getVaultRoot(): string {
  const env =
    process.env.MISSION_CONTROL_VAULT_DIR ?? process.env.MC_VAULT_DIR ?? "";
  if (env) return env;

  const ws = getWorkspaceRootFromCwd();
  if (ws) return path.join(ws, "mission-control-vault");

  return path.join(os.homedir(), ".mission-control", "vault");
}

export function getNotesRoot(): string {
  return path.join(getVaultRoot(), "notes");
}

export function getSketchesRoot(): string {
  return path.join(getVaultRoot(), "sketches");
}

export async function ensureVaultDirs() {
  await fs.mkdir(getNotesRoot(), { recursive: true });
  await fs.mkdir(getSketchesRoot(), { recursive: true });
}

function ensureInRoot(root: string, rel: string): string {
  // Convert Windows backslashes to forward slashes early.
  const cleaned = rel.replace(/\\/g, "/");
  const abs = path.resolve(root, cleaned);
  const rootAbs = path.resolve(root);

  // Ensure abs is inside root.
  const prefix = rootAbs.endsWith(path.sep) ? rootAbs : rootAbs + path.sep;
  if (abs !== rootAbs && !abs.startsWith(prefix)) {
    throw new Error("Invalid path");
  }

  return abs;
}

function titleFromMarkdown(content: string, fallback: string): string {
  try {
    const fm = matter(content);
    const t = fm.data?.title;
    if (typeof t === "string" && t.trim()) return t.trim();

    const body = fm.content;
    const lines = body.split(/\r?\n/);
    for (const line of lines) {
      const m = /^#\s+(.+)$/.exec(line.trim());
      if (m && m[1]) return m[1].trim();
    }
  } catch {
    // ignore
  }

  return fallback;
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(abs)));
      continue;
    }

    out.push(abs);
  }

  return out;
}

export async function listNotes(): Promise<VaultNote[]> {
  await ensureVaultDirs();
  const root = getNotesRoot();

  const files = (await walk(root)).filter((p) => p.endsWith(".md"));

  const notes: VaultNote[] = [];
  for (const abs of files) {
    const rel = path
      .relative(root, abs)
      .replace(/\\/g, "/")
      .replace(/^\//, "");

    const stat = await fs.stat(abs);
    const base = path.basename(rel, ".md");

    let content = "";
    try {
      // Read only the first chunk for title extraction.
      content = (await fs.readFile(abs, "utf8")).slice(0, 16_000);
    } catch {
      content = "";
    }

    notes.push({
      relPath: rel,
      title: titleFromMarkdown(content, base),
      updatedAt: stat.mtimeMs,
    });
  }

  notes.sort((a, b) => b.updatedAt - a.updatedAt);
  return notes;
}

export async function readNote(relPath: string): Promise<string> {
  await ensureVaultDirs();
  const root = getNotesRoot();

  const rel = relPath.replace(/\\/g, "/");
  if (!rel.endsWith(".md")) throw new Error("Note path must end with .md");

  const abs = ensureInRoot(root, rel);
  return fs.readFile(abs, "utf8");
}

export async function writeNote(relPath: string, content: string) {
  await ensureVaultDirs();
  const root = getNotesRoot();

  const rel = relPath.replace(/\\/g, "/");
  if (!rel.endsWith(".md")) throw new Error("Note path must end with .md");

  const abs = ensureInRoot(root, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, "utf8");
}

export async function listSketches(): Promise<VaultSketch[]> {
  await ensureVaultDirs();
  const root = getSketchesRoot();

  const entries = await fs.readdir(root, { withFileTypes: true });
  const sketches: VaultSketch[] = [];

  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!e.name.endsWith(".excalidraw.json")) continue;
    const abs = path.join(root, e.name);
    const stat = await fs.stat(abs);
    const id = e.name.replace(/\.excalidraw\.json$/, "");

    sketches.push({
      id,
      fileName: e.name,
      updatedAt: stat.mtimeMs,
    });
  }

  sketches.sort((a, b) => b.updatedAt - a.updatedAt);
  return sketches;
}

export async function readSketch(sketchId: string): Promise<unknown | null> {
  await ensureVaultDirs();
  const root = getSketchesRoot();

  const safeId = sketchId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) return null;

  const abs = ensureInRoot(root, `${safeId}.excalidraw.json`);

  try {
    const raw = await fs.readFile(abs, "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function writeSketch(sketchId: string, data: unknown) {
  await ensureVaultDirs();
  const root = getSketchesRoot();

  const safeId = sketchId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) throw new Error("Invalid sketch id");

  const abs = ensureInRoot(root, `${safeId}.excalidraw.json`);
  await fs.writeFile(abs, JSON.stringify(data, null, 2) + "\n", "utf8");
}
