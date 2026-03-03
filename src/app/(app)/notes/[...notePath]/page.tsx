import matter from "gray-matter";

import { saveNote } from "@/app/(app)/_actions/notes";
import { NoteEditor } from "@/components/note-editor";
import { readNote } from "@/lib/vault";

export const dynamic = "force-dynamic";

function titleFromMarkdown(content: string, fallback: string): string {
  try {
    const fm = matter(content);
    const t = fm.data?.title;
    if (typeof t === "string" && t.trim()) return t.trim();

    const lines = fm.content.split(/\r?\n/);
    for (const line of lines) {
      const m = /^#\s+(.+)$/.exec(line.trim());
      if (m && m[1]) return m[1].trim();
    }
  } catch {
    // ignore
  }
  return fallback;
}

export default async function NotePage({
  params,
}: {
  params: { notePath: string[] };
}) {
  const relPath = (params.notePath ?? []).join("/").replace(/^\//, "");

  const content = await readNote(relPath);
  const base = relPath.split("/").pop() ?? relPath;
  const title = titleFromMarkdown(content, base.replace(/\.md$/, ""));

  const saveAction = saveNote.bind(null, relPath);

  return (
    <NoteEditor
      relPath={relPath}
      title={title}
      initialContent={content}
      saveAction={saveAction}
    />
  );
}
