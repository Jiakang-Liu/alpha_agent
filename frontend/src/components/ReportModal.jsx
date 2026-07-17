import { useEffect } from "react";
import {
  Copy,
  Download,
  FileText,
  X,
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

export default function ReportModal({
  open,
  onClose,
  report,
  ticker,
  runId = "--",
  generatedAt = "--",
  onCopy,
  onExport,
}) {
  const hasReport = Boolean(report?.trim());

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1627] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${ticker || "Financial"} analysis report`}
      >
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-slate-800 px-6 py-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
              Full Report
            </p>

            <h2 className="mt-2 truncate text-2xl font-bold text-white">
              Financial Analysis — {ticker || "--"}
            </h2>

            <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-400">
              <span>{ticker || "--"}</span>
              <span>•</span>
              <span>
                Generated: {formatGeneratedAt(generatedAt)}
              </span>
              <span>•</span>
              <span>Run ID: {runId}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
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

            <button
              type="button"
              onClick={onClose}
              aria-label="Close report"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <X size={19} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f3ea] p-6 text-slate-950 sm:p-8">
          {hasReport ? (
            <article className="prose prose-slate mx-auto max-w-4xl">
              <ReactMarkdown>{report}</ReactMarkdown>
            </article>
          ) : (
            <div className="flex min-h-full items-center justify-center text-center">
              <div>
                <FileText
                  size={40}
                  className="mx-auto text-slate-400"
                />

                <p className="mt-4 font-medium text-slate-700">
                  No report available
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  This analysis has not generated a report yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}