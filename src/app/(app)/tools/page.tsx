export default function ToolsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-zinc-100">Tools</h1>
      <p className="text-sm text-zinc-400">
        Placeholder: this is where we’ll host your custom internal tools (UI +
        server actions) as you build them.
      </p>

      <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-300">
        Next ideas:
        <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-400">
          <li>“One-click” buttons for common OpenClaw workflows</li>
          <li>Custom forms that create tasks and spawn agents</li>
          <li>Quick links to Solo UI / Grafana / Argo</li>
        </ul>
      </div>
    </div>
  );
}
