"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeSketch } from "@/lib/vault";

export async function createSketch() {
  const id = crypto.randomUUID();

  const initial = {
    type: "excalidraw",
    version: 2,
    source: "mission-control",
    elements: [],
    appState: {
      viewBackgroundColor: "#0a0a0a",
      currentItemStrokeColor: "#e5e7eb",
      currentItemBackgroundColor: "transparent",
    },
    files: {},
  };

  await writeSketch(id, initial);

  revalidatePath("/sketches");
  redirect(`/sketches/${encodeURIComponent(id)}`);
}

export async function saveSketch(sketchId: string, json: string) {
  let data: unknown;
  try {
    data = JSON.parse(json) as unknown;
  } catch {
    throw new Error("Invalid JSON");
  }

  await writeSketch(sketchId, data);

  revalidatePath("/sketches");
  revalidatePath(`/sketches/${encodeURIComponent(sketchId)}`);
}
