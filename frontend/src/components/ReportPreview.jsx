import {
  Copy,
  Download,
  ExternalLink,
  FileText,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import "../styles/markdown.css";

function formatGeneratedAt(value) {
  if (!value || value === "--") {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReportPreview({
  report,
  ticker,
  runId = "--",
  generatedAt = "--",
  status = "success",
  isStreaming,
  onOpen,
  onCopy,
  onExport,
}) {
  const hasReport = Boolean(report?.trim());

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800 bg-[#0b1627]/90 p-5">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium uppercase tracking-wide text-violet-300">
            Report Preview
          </p>

          <h2 className="mt-3 truncate text-2xl font-bold text-white">
            {ticker
              ? `Financial Analysis — ${ticker}`
              : "Financial Analysis Report"}
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
              {ticker || "--"}
            </span>

            <span className="rounded-lg border border-slate-700 bg-[#101c2f] px-3 py-1.5 text-xs text-slate-300">
              Generated: {formatGeneratedAt(generatedAt)}
            </span>

            <span className="rounded-lg border border-slate-700 bg-[#101c2f] px-3 py-1.5 text-xs text-slate-300">
              Run ID: {runId}
            </span>

            <span
              className={[
                "rounded-lg border px-3 py-1.5 text-xs font-medium",
                status === "failed"
                  ? "border-rose-400/20 bg-rose-500/10 text-rose-300"
                  : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
              ].join(" ")}
            >
              {status === "failed" ? "Failed" : "Success"}
            </span>

            <span className="rounded-lg border border-slate-700 bg-[#101c2f] px-3 py-1.5 text-xs text-slate-300">
              Markdown
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            disabled={!hasReport}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ExternalLink size={16} />
            Open Full Report
          </button>

          <button
            type="button"
            onClick={onCopy}
            disabled={!hasReport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Copy size={16} />
            Copy
          </button>

          <button
            type="button"
            onClick={onExport}
            disabled={!hasReport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="relative mt-5 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-800 bg-[#08111f]">
        {!hasReport ? (
          <div className="flex h-full min-h-0 items-center justify-center px-6 text-center">
            <div>
              <FileText
                size={34}
                className="mx-auto text-slate-700"
              />

              <p className="mt-3 text-sm font-medium text-slate-300">
                {isStreaming
                  ? "Generating financial report..."
                  : "No report generated yet"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Start an analysis to generate a report.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-full overflow-hidden px-5 pb-24 pt-5">
              <article className="prose prose-invert max-w-none text-sm leading-7 text-slate-300">
                <ReactMarkdown>{report}</ReactMarkdown>
              </article>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#08111f] via-[#08111f]/95 to-transparent" />

            <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
              <span className="rounded-full border border-slate-700 bg-[#0b1627]/95 px-4 py-1.5 text-xs text-slate-400 shadow-lg">
                Open full report to continue reading
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}