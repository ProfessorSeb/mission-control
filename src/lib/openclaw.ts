import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createReadStream } from "node:fs";
import readline from "node:readline";

export type OpenClawSessionSummary = {
  sessionKey: string;
  sessionId: string;
  updatedAt: number;
  label?: string;
};

export type OpenClawRun = {
  runKey: string;
  sessionKey: string;
  sessionId: string;
  toolCallId: string;
  timestamp: number;

  // toolCall arguments
  label?: string;
  task?: string;
  agentId?: string;
  model?: string;
  mode?: string;

  // toolResult data (derived from toolResult messages)
  success?: boolean;
  childSessionKey?: string;
  runId?: string;
  error?: string;
};

function toMs(ts: unknown): number {
  if (typeof ts === "number") return ts;
  if (typeof ts === "string") {
    const ms = Date.parse(ts);
    return Number.isFinite(ms) ? ms : 0;
  }
  return 0;
}

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const rec = item as Record<string, unknown>;
      if (rec["type"] !== "text") return "";
      return typeof rec["text"] === "string" ? (rec["text"] as string) : "";
    })
    .join("");
}

export function getOpenClawHome(): string {
  const fromEnv = process.env.OPENCLAW_HOME;
  if (fromEnv) return fromEnv;
  return path.join(os.homedir(), ".openclaw");
}

function sessionsDir(): string {
  return path.join(getOpenClawHome(), "agents", "main", "sessions");
}

export async function getOpenClawSessions(): Promise<OpenClawSessionSummary[]> {
  const p = path.join(sessionsDir(), "sessions.json");

  try {
    const raw = await fs.readFile(p, "utf8");
    const obj = JSON.parse(raw) as Record<string, unknown>;

    const list = Object.entries(obj)
      .map(([sessionKey, v]): OpenClawSessionSummary | null => {
        if (!v || typeof v !== "object") return null;
        const rec = v as Record<string, unknown>;
        const sessionId = String(rec["sessionId"] ?? "");
        if (!sessionId) return null;
        return {
          sessionKey,
          sessionId,
          updatedAt: Number(rec["updatedAt"] ?? 0),
          label:
            typeof rec["label"] === "string" ? (rec["label"] as string) : undefined,
        };
      })
      .filter((x): x is OpenClawSessionSummary => Boolean(x))
      .sort((a, b) => b.updatedAt - a.updatedAt);

    return list;
  } catch {
    return [];
  }
}

async function fileExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function ensureRun(
  runsByKey: Map<string, OpenClawRun>,
  base: Pick<OpenClawRun, "runKey" | "sessionKey" | "sessionId" | "toolCallId" | "timestamp">,
): OpenClawRun {
  const existing = runsByKey.get(base.runKey);
  if (existing) {
    if (!existing.timestamp && base.timestamp) existing.timestamp = base.timestamp;
    if (base.timestamp && (!existing.timestamp || base.timestamp < existing.timestamp)) {
      existing.timestamp = base.timestamp;
    }
    return existing;
  }

  const created: OpenClawRun = {
    ...base,
  };
  runsByKey.set(base.runKey, created);
  return created;
}

export async function getOpenClawRuns({
  limit = 50,
  sessionLimit = 10,
}: {
  limit?: number;
  sessionLimit?: number;
} = {}): Promise<OpenClawRun[]> {
  const sessions = await getOpenClawSessions();
  const chosen = sessions.slice(0, sessionLimit);

  const runsByKey = new Map<string, OpenClawRun>();

  for (const s of chosen) {
    const jsonlPath = path.join(sessionsDir(), `${s.sessionId}.jsonl`);
    if (!(await fileExists(jsonlPath))) continue;

    const rl = readline.createInterface({
      input: createReadStream(jsonlPath, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(line) as unknown;
      } catch {
        continue;
      }

      if (!parsed || typeof parsed !== "object") continue;
      const rec = parsed as Record<string, unknown>;

      const ts = toMs(rec["timestamp"]);
      const msg = rec["message"];
      if (!msg || typeof msg !== "object") continue;
      const msgRec = msg as Record<string, unknown>;

      const role = String(msgRec["role"] ?? "");

      // --- Detect sub-agent spawns from assistant tool calls
      if (role === "assistant") {
        const content = msgRec["content"];
        if (!Array.isArray(content)) continue;

        for (const item of content) {
          if (!item || typeof item !== "object") continue;
          const itemRec = item as Record<string, unknown>;

          if (itemRec["type"] !== "toolCall") continue;
          if (itemRec["name"] !== "sessions_spawn") continue;

          const toolCallId = String(itemRec["id"] ?? "") || "unknown";
          const runKey = `${s.sessionId}:${toolCallId}`;

          const run = ensureRun(runsByKey, {
            runKey,
            sessionKey: s.sessionKey,
            sessionId: s.sessionId,
            toolCallId,
            timestamp: ts,
          });

          const argsVal = itemRec["arguments"];
          const args =
            argsVal && typeof argsVal === "object"
              ? (argsVal as Record<string, unknown>)
              : ({} as Record<string, unknown>);

          run.label =
            typeof args["label"] === "string" ? (args["label"] as string) : run.label;
          run.task =
            typeof args["task"] === "string" ? (args["task"] as string) : run.task;
          run.agentId =
            typeof args["agentId"] === "string" ? (args["agentId"] as string) : run.agentId;
          run.model =
            typeof args["model"] === "string" ? (args["model"] as string) : run.model;
          run.mode =
            typeof args["mode"] === "string" ? (args["mode"] as string) : run.mode;
        }

        continue;
      }

      // --- Attach tool results (accepted / error + runId / childSessionKey)
      // OpenClaw emits tool results as a separate message with role=toolResult.
      if (role === "toolResult" && msgRec["toolName"] === "sessions_spawn") {
        const toolCallId = String(msgRec["toolCallId"] ?? "") || "unknown";
        const runKey = `${s.sessionId}:${toolCallId}`;

        const run = ensureRun(runsByKey, {
          runKey,
          sessionKey: s.sessionKey,
          sessionId: s.sessionId,
          toolCallId,
          timestamp: ts,
        });

        const text = contentToText(msgRec["content"]);
        if (!text) continue;

        try {
          const result = JSON.parse(text) as Record<string, unknown>;
          const status = typeof result["status"] === "string" ? (result["status"] as string) : "";

          if (status) {
            // sessions_spawn uses accepted|error
            if (status === "accepted" || status === "ok") run.success = true;
            if (status === "error" || status === "failed") run.success = false;
          }

          if (typeof result["error"] === "string") run.error = result["error"] as string;
          if (typeof result["childSessionKey"] === "string")
            run.childSessionKey = result["childSessionKey"] as string;
          if (typeof result["runId"] === "string") run.runId = result["runId"] as string;

          if (!run.mode && typeof result["mode"] === "string") {
            run.mode = result["mode"] as string;
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  }

  const runs = Array.from(runsByKey.values());
  runs.sort((a, b) => b.timestamp - a.timestamp);
  return runs.slice(0, limit);
}
