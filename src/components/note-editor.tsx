"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  relPath: string;
  title: string;
  initialContent: string;
  saveAction: (formData: FormData) => Promise<void>;
};

export function NoteEditor({ relPath, title, initialContent, saveAction }: Props) {
  const [mode, setMode] = React.useState<"edit" | "preview">("edit");
  const [text, setText] = React.useState(initialContent);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-zinc-100">{title}</h1>
          <div className="mt-1 truncate font-mono text-xs text-zinc-500">
            {relPath}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
          >
            {mode === "edit" ? "Preview" : "Edit"}
          </button>

          <button
            type="submit"
            form="note-save"
            className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
          >
            Save
          </button>
        </div>
      </div>

      <form id="note-save" action={saveAction} className="space-y-3">
        <input type="hidden" name="relPath" value={relPath} />

        {mode === "edit" ? (
          <textarea
            name="content"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-[70vh] w-full resize-none rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-sm text-zinc-100 outline-none focus:border-zinc-600"
            spellCheck={false}
          />
        ) : (
          <div className="h-[70vh] overflow-auto rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="space-y-3 text-sm text-zinc-200">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: (p) => (
                    <h1 className="text-xl font-semibold text-zinc-100" {...p} />
                  ),
                  h2: (p) => (
                    <h2 className="mt-6 text-lg font-semibold text-zinc-100" {...p} />
                  ),
                  h3: (p) => (
                    <h3 className="mt-5 text-base font-semibold text-zinc-100" {...p} />
                  ),
                  p: (p) => <p className="leading-7" {...p} />,
                  a: (p) => (
                    <a
                      className="text-zinc-100 underline underline-offset-4 hover:text-white"
                      {...p}
                    />
                  ),
                  code: ({ className, children, ...props }) => (
                    <code
                      className={
                        "rounded bg-zinc-900 px-1 py-0.5 font-mono text-xs text-zinc-200 " +
                        (className ?? "")
                      }
                      {...props}
                    >
                      {children}
                    </code>
                  ),
                  pre: (p) => (
                    <pre
                      className="overflow-auto rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs"
                      {...p}
                    />
                  ),
                  li: (p) => <li className="ml-6 list-disc" {...p} />,
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
