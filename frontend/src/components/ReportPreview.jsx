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

function MetadataBadge({
  children,
  variant = "default",
  title,
}) {
  const variantClassName =
    variant === "ticker"
      ? "border-violet-400/20 bg-violet-500/10 text-violet-300"
      : variant === "success"
        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
        : variant === "failed"
          ? "border-rose-400/20 bg-rose-500/10 text-rose-300"
          : "border-slate-700 bg-[#101c2f] text-slate-300";

  return (
    <span
      title={title}
      className={[
        "inline-flex max-w-full min-w-0 items-center",
        "rounded-lg border px-2.5 py-1",
        "text-xs font-medium",
        variantClassName,
      ].join(" ")}
    >
      <span className="truncate">
        {children}
      </span>
    </span>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  primary = false,
  hideLabelOnSmallScreen = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={[
        "inline-flex shrink-0 items-center justify-center",
        "gap-2 rounded-lg px-3 py-2",
        "text-xs font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-40",
        primary
          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:brightness-110"
          : "border border-slate-700 text-slate-200 hover:bg-white/5",
      ].join(" ")}
    >
      <Icon
        size={15}
        className="shrink-0"
      />

      <span
        className={
          hideLabelOnSmallScreen
            ? "hidden whitespace-nowrap sm:inline"
            : "whitespace-nowrap"
        }
      >
        {label}
      </span>
    </button>
  );
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

  const reportTitle = ticker
    ? `Financial Analysis — ${ticker}`
    : "Financial Analysis Report";

  const formattedGeneratedAt =
    formatGeneratedAt(generatedAt);

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1627]/90 p-4 2xl:p-5">
      <div className="flex min-w-0 shrink-0 flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium uppercase tracking-wide text-violet-300">
            Report Preview
          </p>

          <h2
            title={reportTitle}
            className="mt-2 truncate text-xl font-bold leading-tight text-white 2xl:text-2xl"
          >
            {reportTitle}
          </h2>

          <div className="mt-3 flex min-w-0 flex-wrap gap-2">
            <MetadataBadge
              variant="ticker"
              title={ticker || "--"}
            >
              {ticker || "--"}
            </MetadataBadge>

            <MetadataBadge
              title={`Generated: ${formattedGeneratedAt}`}
            >
              Generated: {formattedGeneratedAt}
            </MetadataBadge>

            <MetadataBadge
              title={`Run ID: ${runId}`}
            >
              Run ID: {runId}
            </MetadataBadge>

            <MetadataBadge
              variant={
                status === "failed"
                  ? "failed"
                  : "success"
              }
            >
              {status === "failed"
                ? "Failed"
                : "Success"}
            </MetadataBadge>

            <MetadataBadge>
              Markdown
            </MetadataBadge>
          </div>
        </div>

        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 xl:justify-end">
          <ActionButton
            icon={ExternalLink}
            label="Open Full Report"
            onClick={onOpen}
            disabled={!hasReport}
            primary
          />

          <ActionButton
            icon={Copy}
            label="Copy"
            onClick={onCopy}
            disabled={!hasReport}
            hideLabelOnSmallScreen
          />

          <ActionButton
            icon={Download}
            label="Export"
            onClick={onExport}
            disabled={!hasReport}
            hideLabelOnSmallScreen
          />
        </div>
      </div>

      <div className="relative mt-4 min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-800 bg-[#08111f]">
        {!hasReport ? (
          <div className="flex h-full min-h-[140px] items-center justify-center px-6 text-center">
            <div className="max-w-md">
              <FileText
                size={32}
                className="mx-auto text-slate-700"
              />

              <p className="mt-3 text-sm font-medium text-slate-300">
                {isStreaming
                  ? "Generating financial report..."
                  : "No report generated yet"}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {isStreaming
                  ? "The preview will appear as soon as report content is available."
                  : "Start an analysis to generate a report."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-full min-h-0 overflow-hidden px-4 pb-20 pt-4">
              <article className="prose prose-invert max-w-none break-words text-sm leading-7 text-slate-300 prose-headings:break-words prose-pre:max-w-full prose-pre:overflow-hidden prose-table:block prose-table:max-w-full prose-table:overflow-hidden">
                <ReactMarkdown>
                  {report}
                </ReactMarkdown>

                {isStreaming && (
                  <span className="ml-1 inline-block animate-pulse text-cyan-300">
                    |
                  </span>
                )}
              </article>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#08111f] via-[#08111f]/95 to-transparent" />

            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
              <span className="max-w-full truncate rounded-full border border-slate-700 bg-[#0b1627]/95 px-4 py-1.5 text-xs text-slate-400 shadow-lg">
                {isStreaming
                  ? "Report generation in progress"
                  : "Open full report to continue reading"}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}