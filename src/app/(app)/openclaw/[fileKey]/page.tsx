import Link from "next/link";
import { notFound } from "next/navigation";

import { saveOpenClawFile } from "@/app/(app)/_actions/openclaw-workspace";
import { NoteEditor } from "@/components/note-editor";
import {
  getManagedFile,
  readManagedFile,
} from "@/lib/openclaw-workspace";

export const dynamic = "force-dynamic";

export default async function OpenClawFilePage({
  params,
}: {
  params: { fileKey: string };
}) {
  const meta = getManagedFile(params.fileKey);
  if (!meta) notFound();

  const content = await readManagedFile(meta.key);
  const saveAction = saveOpenClawFile.bind(null, meta.key);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/openclaw"
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← Back to OpenClaw
        </Link>
      </div>

      <NoteEditor
        relPath={meta.relPath}
        title={meta.label}
        initialContent={content}
        saveAction={saveAction}
      />
    </div>
  );
}
