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
        "inline-flex min-w-0 items-center",
        "max-w-full",
        "rounded-[clamp(7px,0.6vw,10px)]",
        "border",
        "px-[clamp(8px,0.8vw,12px)]",
        "py-[clamp(4px,0.45vw,6px)]",
        "text-[clamp(10px,0.72vw,12px)]",
        "font-medium",
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
        "gap-[clamp(5px,0.5vw,8px)]",
        "rounded-[clamp(8px,0.7vw,12px)]",
        "px-[clamp(9px,0.9vw,16px)]",
        "py-[clamp(7px,0.7vw,10px)]",
        "text-[clamp(11px,0.8vw,14px)]",
        "font-semibold",
        "transition",
        "disabled:cursor-not-allowed",
        "disabled:opacity-40",
        primary
          ? [
              "bg-gradient-to-r",
              "from-violet-600",
              "to-purple-600",
              "text-white",
              "hover:brightness-110",
            ].join(" ")
          : [
              "border",
              "border-slate-700",
              "text-slate-200",
              "hover:bg-white/5",
            ].join(" "),
      ].join(" ")}
    >
      <Icon
        className="
          h-[clamp(14px,1.1vw,16px)]
          w-[clamp(14px,1.1vw,16px)]
          shrink-0
        "
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
    <section
      className="
        flex
        h-full
        min-h-0
        min-w-0
        flex-col
        overflow-hidden
        rounded-[clamp(12px,1vw,18px)]
        border
        border-slate-800
        bg-[#0b1627]/90
        p-[clamp(12px,1.25vw,20px)]
      "
    >
      <div
        className="
          flex
          min-w-0
          shrink-0
          flex-col
          gap-[clamp(12px,1vw,16px)]
          2xl:flex-row
          2xl:items-start
          2xl:justify-between
        "
      >
        <div className="min-w-0 flex-1">
          <p
            className="
              truncate
              text-[clamp(11px,0.85vw,14px)]
              font-medium
              uppercase
              tracking-[0.08em]
              text-violet-300
            "
          >
            Report Preview
          </p>

          <h2
            title={reportTitle}
            className="
              mt-[clamp(7px,0.8vw,12px)]
              truncate
              text-[clamp(18px,1.7vw,26px)]
              font-bold
              leading-tight
              text-white
            "
          >
            {reportTitle}
          </h2>

          <div
            className="
              mt-[clamp(10px,1vw,16px)]
              flex
              min-w-0
              flex-wrap
              gap-[clamp(5px,0.6vw,8px)]
            "
          >
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

        <div
          className="
            flex
            min-w-0
            shrink-0
            flex-wrap
            items-center
            gap-[clamp(6px,0.6vw,8px)]
            2xl:justify-end
          "
        >
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

      <div
        className="
          relative
          mt-[clamp(12px,1.2vw,20px)]
          min-h-[clamp(220px,32vh,420px)]
          min-w-0
          flex-1
          overflow-hidden
          rounded-[clamp(10px,0.8vw,14px)]
          border
          border-slate-800
          bg-[#08111f]
        "
      >
        {!hasReport ? (
          <div
            className="
              flex
              h-full
              min-h-0
              items-center
              justify-center
              px-[clamp(16px,2vw,32px)]
              text-center
            "
          >
            <div className="max-w-md">
              <FileText
                className="
                  mx-auto
                  h-[clamp(28px,2.5vw,36px)]
                  w-[clamp(28px,2.5vw,36px)]
                  text-slate-700
                "
              />

              <p
                className="
                  mt-[clamp(8px,0.8vw,12px)]
                  text-[clamp(12px,0.85vw,14px)]
                  font-medium
                  text-slate-300
                "
              >
                {isStreaming
                  ? "Generating financial report..."
                  : "No report generated yet"}
              </p>

              <p
                className="
                  mt-[clamp(3px,0.35vw,5px)]
                  text-[clamp(10px,0.72vw,12px)]
                  leading-relaxed
                  text-slate-500
                "
              >
                {isStreaming
                  ? "The preview will appear as soon as report content is available."
                  : "Start an analysis to generate a report."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className="
                h-full
                min-h-0
                overflow-hidden
                px-[clamp(12px,1.25vw,20px)]
                pb-[clamp(72px,9vh,104px)]
                pt-[clamp(12px,1.25vw,20px)]
              "
            >
              <article
                className="
                  prose
                  prose-invert
                  max-w-none
                  break-words
                  text-[clamp(12px,0.85vw,14px)]
                  leading-[clamp(1.6,1.7,1.8)]
                  text-slate-300
                  prose-headings:break-words
                  prose-pre:max-w-full
                  prose-pre:overflow-hidden
                  prose-table:block
                  prose-table:max-w-full
                  prose-table:overflow-hidden
                "
              >
                <ReactMarkdown>
                  {report}
                </ReactMarkdown>

                {isStreaming && (
                  <span
                    className="
                      ml-1
                      inline-block
                      animate-pulse
                      text-cyan-300
                    "
                  >
                    |
                  </span>
                )}
              </article>
            </div>

            <div
              className="
                pointer-events-none
                absolute
                inset-x-0
                bottom-0
                h-[clamp(80px,11vh,120px)]
                bg-gradient-to-t
                from-[#08111f]
                via-[#08111f]/95
                to-transparent
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                inset-x-0
                bottom-[clamp(12px,1.2vw,20px)]
                flex
                justify-center
                px-[clamp(10px,1vw,16px)]
              "
            >
              <span
                className="
                  max-w-full
                  truncate
                  rounded-full
                  border
                  border-slate-700
                  bg-[#0b1627]/95
                  px-[clamp(10px,1vw,16px)]
                  py-[clamp(5px,0.5vw,7px)]
                  text-[clamp(10px,0.72vw,12px)]
                  text-slate-400
                  shadow-lg
                "
              >
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