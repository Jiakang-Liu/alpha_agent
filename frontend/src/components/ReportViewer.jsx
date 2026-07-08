import ReactMarkdown from "react-markdown";
import { Copy, Download, SlidersHorizontal } from "lucide-react";
import "../styles/markdown.css";

export default function ReportViewer({
  report,
  isStreaming,
  ticker,
  runId,
  generatedAt,
}) {
  const hasReport = Boolean(report?.trim());

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800 bg-[#0b1627]/90 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-300">
            Analysis Report Engine
          </p>

          <h1 className="mt-5 text-2xl font-bold leading-tight text-white">
            {hasReport
              ? `Free Cash Flow (FCF) Analysis – ${ticker}`
              : "Real-time Markdown Rendering"}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800">
            <Copy size={15} />
            Copy
          </button>

          <button className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800">
            <Download size={15} />
            Export
          </button>

          <button className="flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm text-violet-300 transition hover:bg-violet-500/20">
            <SlidersHorizontal size={15} />
            View Raw
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
          {ticker || "--"}
        </span>

        <span className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1 text-sm text-slate-300">
          Generated: {generatedAt || "--"}
        </span>

        <span className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1 text-sm text-slate-300">
          Run ID: {runId || "--"}
        </span>

        <span
          className={`rounded-lg border px-3 py-1 text-sm ${
            isStreaming
              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
              : hasReport
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-slate-700 bg-slate-800/60 text-slate-400"
          }`}
        >
          {isStreaming ? "Running" : hasReport ? "Success" : "Idle"}
        </span>

        <span className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1 text-sm text-slate-300">
          Markdown
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-[#faf7ef] p-8 text-black">
        <div className="prose max-w-none">
          {hasReport ? (
            <ReactMarkdown>{report}</ReactMarkdown>
          ) : (
            <div className="text-slate-500">
              Waiting for analysis report...
            </div>
          )}

          {isStreaming && <span className="animate-pulse">|</span>}
        </div>
      </div>
    </div>
  );
}