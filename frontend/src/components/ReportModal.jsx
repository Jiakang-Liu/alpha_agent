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

function ModalActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="
        inline-flex
        shrink-0
        items-center
        justify-center
        gap-[clamp(5px,0.5vw,8px)]
        rounded-[clamp(8px,0.7vw,12px)]
        border
        border-slate-700
        px-[clamp(9px,0.9vw,16px)]
        py-[clamp(7px,0.7vw,10px)]
        text-[clamp(11px,0.8vw,14px)]
        text-slate-200
        transition
        hover:bg-white/5
        disabled:cursor-not-allowed
        disabled:opacity-40
      "
    >
      <Icon
        className="
          h-[clamp(14px,1.1vw,16px)]
          w-[clamp(14px,1.1vw,16px)]
          shrink-0
        "
      />

      <span className="hidden whitespace-nowrap sm:inline">
        {label}
      </span>
    </button>
  );
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

  const reportTitle = `Financial Analysis — ${
    ticker || "--"
  }`;

  const formattedGeneratedAt =
    formatGeneratedAt(generatedAt);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow =
      document.body.style.overflow;

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        h-dvh
        w-full
        items-center
        justify-center
        overflow-hidden
        bg-slate-950/80
        p-[clamp(8px,1.5vw,24px)]
        backdrop-blur-sm
      "
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        className="
          flex
          h-[min(94dvh,960px)]
          min-h-0
          w-full
          min-w-0
          max-w-[clamp(900px,88vw,1440px)]
          flex-col
          overflow-hidden
          rounded-[clamp(12px,1.2vw,20px)]
          border
          border-slate-700
          bg-[#0b1627]
          shadow-2xl
        "
        onMouseDown={(event) =>
          event.stopPropagation()
        }
        role="dialog"
        aria-modal="true"
        aria-label={`${ticker || "Financial"} analysis report`}
      >
        <header
          className="
            flex
            min-w-0
            shrink-0
            flex-col
            gap-[clamp(10px,1vw,16px)]
            border-b
            border-slate-800
            px-[clamp(14px,1.8vw,28px)]
            py-[clamp(12px,1.4vw,22px)]
            lg:flex-row
            lg:items-start
            lg:justify-between
          "
        >
          <div className="min-w-0 flex-1">
            <p
              className="
                truncate
                text-[clamp(10px,0.72vw,12px)]
                font-medium
                uppercase
                tracking-[0.08em]
                text-violet-300
              "
            >
              Full Report
            </p>

            <h2
              title={reportTitle}
              className="
                mt-[clamp(5px,0.6vw,8px)]
                truncate
                text-[clamp(18px,1.8vw,28px)]
                font-bold
                leading-tight
                text-white
              "
            >
              {reportTitle}
            </h2>

            <div
              className="
                mt-[clamp(7px,0.8vw,12px)]
                flex
                min-w-0
                flex-wrap
                items-center
                gap-x-[clamp(5px,0.6vw,8px)]
                gap-y-[clamp(3px,0.35vw,5px)]
                text-[clamp(10px,0.72vw,12px)]
                text-slate-400
              "
            >
              <span className="max-w-full truncate">
                {ticker || "--"}
              </span>

              <span
                aria-hidden="true"
                className="text-slate-600"
              >
                •
              </span>

              <span
                className="max-w-full truncate"
                title={`Generated: ${formattedGeneratedAt}`}
              >
                Generated: {formattedGeneratedAt}
              </span>

              <span
                aria-hidden="true"
                className="text-slate-600"
              >
                •
              </span>

              <span
                className="max-w-full truncate"
                title={`Run ID: ${runId}`}
              >
                Run ID: {runId}
              </span>
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
              lg:justify-end
            "
          >
            <ModalActionButton
              icon={Copy}
              label="Copy"
              onClick={onCopy}
              disabled={!hasReport}
            />

            <ModalActionButton
              icon={Download}
              label="Export"
              onClick={onExport}
              disabled={!hasReport}
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close report"
              title="Close report"
              className="
                flex
                h-[clamp(34px,2.8vw,42px)]
                w-[clamp(34px,2.8vw,42px)]
                shrink-0
                items-center
                justify-center
                rounded-[clamp(8px,0.7vw,12px)]
                border
                border-slate-700
                text-slate-400
                transition
                hover:bg-white/5
                hover:text-white
              "
            >
              <X
                className="
                  h-[clamp(16px,1.3vw,19px)]
                  w-[clamp(16px,1.3vw,19px)]
                "
              />
            </button>
          </div>
        </header>

        <div
          className="
            min-h-0
            min-w-0
            flex-1
            overflow-y-auto
            overflow-x-hidden
            bg-[#f7f3ea]
            px-[clamp(16px,3vw,48px)]
            py-[clamp(18px,2.5vw,40px)]
            text-slate-950
          "
        >
          {hasReport ? (
            <article
              className="
                prose
                prose-slate
                mx-auto
                max-w-[clamp(720px,72vw,1050px)]
                break-words
                text-[clamp(13px,0.95vw,16px)]
                leading-[1.75]
                prose-headings:break-words
                prose-img:max-w-full
                prose-pre:max-w-full
                prose-pre:overflow-x-auto
                prose-table:block
                prose-table:max-w-full
                prose-table:overflow-x-auto
              "
            >
              <ReactMarkdown>
                {report}
              </ReactMarkdown>
            </article>
          ) : (
            <div
              className="
                flex
                min-h-full
                items-center
                justify-center
                px-[clamp(12px,2vw,32px)]
                text-center
              "
            >
              <div className="max-w-md">
                <FileText
                  className="
                    mx-auto
                    h-[clamp(32px,3vw,44px)]
                    w-[clamp(32px,3vw,44px)]
                    text-slate-400
                  "
                />

                <p
                  className="
                    mt-[clamp(10px,1vw,16px)]
                    text-[clamp(14px,1vw,17px)]
                    font-medium
                    text-slate-700
                  "
                >
                  No report available
                </p>

                <p
                  className="
                    mt-[clamp(3px,0.4vw,6px)]
                    text-[clamp(11px,0.85vw,14px)]
                    leading-relaxed
                    text-slate-500
                  "
                >
                  This analysis has not generated a
                  report yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}