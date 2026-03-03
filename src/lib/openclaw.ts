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

  // toolResult data
  success?: boolean;
  childSessionKey?: string;
  runId?: string;
};

function toMs(ts: unknown): number {
  if (typeof ts === "number") return ts;
  if (typeof ts === "string") {
    const ms = Date.parse(ts);
    return Number.isFinite(ms) ? ms : 0;
  }
  return 0;
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
          label: typeof rec["label"] === "string" ? (rec["label"] as string) : undefined,
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
      if (msgRec["role"] !== "assistant") continue;

      const content = msgRec["content"];
      if (!Array.isArray(content)) continue;

      for (const item of content) {
        if (!item || typeof item !== "object") continue;
        const itemRec = item as Record<string, unknown>;

        const type = itemRec["type"];
        const name = itemRec["name"];
        if (name !== "sessions_spawn") continue;
        if (type !== "toolCall" && type !== "toolResult") continue;

        const toolCallId = String(itemRec["id"] ?? "") || "unknown";
        const runKey = `${s.sessionId}:${toolCallId}`;

        const existing: OpenClawRun = runsByKey.get(runKey) ?? {
          runKey,
          sessionKey: s.sessionKey,
          sessionId: s.sessionId,
          toolCallId,
          timestamp: ts,
        };

        if (ts && (!existing.timestamp || ts < existing.timestamp)) {
          existing.timestamp = ts;
        }

        if (type === "toolCall") {
          const argsVal = itemRec["arguments"];
          const args =
            argsVal && typeof argsVal === "object"
              ? (argsVal as Record<string, unknown>)
              : ({} as Record<string, unknown>);

          existing.label =
            typeof args["label"] === "string" ? (args["label"] as string) : existing.label;
          existing.task =
            typeof args["task"] === "string" ? (args["task"] as string) : existing.task;
          existing.agentId =
            typeof args["agentId"] === "string"
              ? (args["agentId"] as string)
              : existing.agentId;
          existing.model =
            typeof args["model"] === "string" ? (args["model"] as string) : existing.model;
          existing.mode =
            typeof args["mode"] === "string" ? (args["mode"] as string) : existing.mode;
        }

        if (type === "toolResult") {
          const resultVal = itemRec["result"];
          if (resultVal && typeof resultVal === "object") {
            const resultRec = resultVal as Record<string, unknown>;
            if (typeof resultRec["success"] === "boolean") {
              existing.success = resultRec["success"] as boolean;
            }

            const dataVal = resultRec["data"];
            if (dataVal && typeof dataVal === "object") {
              const dataRec = dataVal as Record<string, unknown>;
              if (typeof dataRec["childSessionKey"] === "string") {
                existing.childSessionKey = dataRec["childSessionKey"] as string;
              }
              if (typeof dataRec["runId"] === "string") {
                existing.runId = dataRec["runId"] as string;
              }
            }
          }
        }

        runsByKey.set(runKey, existing);
      }
    }
  }

  const runs = Array.from(runsByKey.values());
  runs.sort((a, b) => b.timestamp - a.timestamp);
  return runs.slice(0, limit);
}
