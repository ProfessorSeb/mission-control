"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import "@excalidraw/excalidraw/index.css";

import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";

import { saveSketch } from "@/app/(app)/_actions/sketches";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false },
);

type Props = {
  sketchId: string;
  initialData: unknown;
};

export function SketchEditor({ sketchId, initialData }: Props) {
  const apiRef = React.useRef<ExcalidrawImperativeAPI | null>(null);
  const [saving, startSaving] = React.useTransition();
  const [status, setStatus] = React.useState<string>("");
  const lastSnapshot = React.useRef<{
    elements: readonly unknown[];
    appState: AppState;
    files: BinaryFiles;
  } | null>(null);

  function snapshot() {
    if (apiRef.current) {
      const elements = apiRef.current.getSceneElements();
      const appState = apiRef.current.getAppState();
      const files = apiRef.current.getFiles();
      return { elements, appState, files };
    }
    return lastSnapshot.current;
  }

  async function onSave() {
    const snap = snapshot();
    if (!snap) return;

    const payload = {
      type: "excalidraw",
      version: 2,
      source: "mission-control",
      elements: snap.elements,
      appState: snap.appState,
      files: snap.files,
      updatedAt: new Date().toISOString(),
    };

    setStatus("Saving…");
    startSaving(async () => {
      try {
        await saveSketch(sketchId, JSON.stringify(payload));
        setStatus(`Saved ${new Date().toLocaleTimeString()}`);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-zinc-100">Sketch</h1>
          <div className="mt-1 truncate font-mono text-xs text-zinc-500">
            {sketchId}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-60"
          >
            Save
          </button>
          <div className="text-xs text-zinc-500">{status}</div>
        </div>
      </div>

      <div className="h-[75vh] overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
        <Excalidraw
          excalidrawAPI={(api: ExcalidrawImperativeAPI) => {
            apiRef.current = api;
          }}
          initialData={initialData as ExcalidrawInitialDataState}
          onChange={(elements, appState, files) => {
            lastSnapshot.current = {
              elements,
              appState,
              files,
            };
          }}
          theme="dark"
        />
      </div>

      <div className="text-xs text-zinc-500">
        Tip: this file is saved under <span className="font-mono">vault/sketches</span> as <span className="font-mono">{sketchId}.excalidraw.json</span>
      </div>
    </div>
  );
}
