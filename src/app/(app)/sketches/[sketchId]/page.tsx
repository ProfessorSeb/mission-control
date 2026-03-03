import Link from "next/link";
import { notFound } from "next/navigation";

import { SketchEditor } from "@/components/sketch-editor";
import { readSketch } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default async function SketchPage({
  params,
}: {
  params: { sketchId: string };
}) {
  const data = await readSketch(params.sketchId);
  if (!data) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/sketches"
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← Back to sketches
        </Link>
      </div>

      <SketchEditor sketchId={params.sketchId} initialData={data} />
    </div>
  );
}
