import {
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  Play,
  RotateCw,
} from "lucide-react";

function BackendStatus({ status }) {
  const statusConfig = {
    checking: {
      icon: LoaderCircle,
      title: "Checking backend",
      description: "Connecting to the analysis service...",
      iconClassName: "animate-spin text-slate-400",
      containerClassName:
        "border-slate-700 bg-slate-500/5",
    },

    waking: {
      icon: LoaderCircle,
      title: "Backend waking up",
      description:
        "The first connection may take a little longer.",
      iconClassName: "animate-spin text-cyan-400",
      containerClassName:
        "border-cyan-400/20 bg-cyan-500/5",
    },

    ready: {
      icon: CircleCheck,
      title: "Backend ready",
      description:
        "The analysis service is available.",
      iconClassName: "text-emerald-400",
      containerClassName:
        "border-emerald-400/20 bg-emerald-500/5",
    },

    unavailable: {
      icon: CircleAlert,
      title: "Backend unavailable",
      description:
        "Unable to connect to the analysis service.",
      iconClassName: "text-rose-400",
      containerClassName:
        "border-rose-400/20 bg-rose-500/5",
    },
  };

  const config =
    statusConfig[status] ||
    statusConfig.checking;

  const StatusIcon = config.icon;

  return (
    <div
      className={[
        "flex min-w-0 items-start",
        "gap-[clamp(8px,0.8vw,12px)]",
        "rounded-[clamp(10px,0.8vw,14px)]",
        "border",
        "px-[clamp(10px,1vw,16px)]",
        "py-[clamp(9px,0.8vw,12px)]",
        config.containerClassName,
      ].join(" ")}
      aria-live="polite"
    >
      <StatusIcon
        size={18}
        className={[
          "mt-0.5 shrink-0",
          config.iconClassName,
        ].join(" ")}
      />

      <div className="min-w-0 flex-1">
        <div className="truncate text-[clamp(12px,0.85vw,14px)] font-medium text-slate-200">
          {config.title}
        </div>

        <div className="mt-0.5 break-words text-[clamp(10px,0.72vw,12px)] leading-relaxed text-slate-500">
          {config.description}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({
  ticker,
  query,
  isStreaming,
  backendStatus = "checking",
  setTicker,
  setQuery,
  onSubmit,
  onRetryBackend,
}) {
  const isBackendReady =
    backendStatus === "ready";

  const isBackendUnavailable =
    backendStatus === "unavailable";

  const isBackendWaking =
    backendStatus === "checking" ||
    backendStatus === "waking";

  const isFormIncomplete =
    !ticker.trim() ||
    !query.trim();

  const isSubmitDisabled =
    isStreaming ||
    isFormIncomplete ||
    !isBackendReady;

  function handleTickerChange(event) {
    const normalizedTicker =
      event.target.value
        .toUpperCase()
        .replace(/[^A-Z0-9.-]/g, "");

    setTicker(normalizedTicker);
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    if (isBackendUnavailable) {
      onRetryBackend?.();
      return;
    }

    if (isSubmitDisabled) {
      return;
    }

    onSubmit?.(event);
  }

  function renderButtonContent() {
    if (isStreaming) {
      return (
        <>
          <LoaderCircle
            size={16}
            className="shrink-0 animate-spin"
          />
          <span className="truncate">
            ANALYSIS IN PROGRESS...
          </span>
        </>
      );
    }

    if (isBackendWaking) {
      return (
        <>
          <LoaderCircle
            size={16}
            className="shrink-0 animate-spin"
          />
          <span className="truncate">
            WAKING BACKEND...
          </span>
        </>
      );
    }

    if (isBackendUnavailable) {
      return (
        <>
          <RotateCw
            size={16}
            className="shrink-0"
          />
          <span className="truncate">
            RETRY CONNECTION
          </span>
        </>
      );
    }

    return (
      <>
        <Play
          size={16}
          fill="currentColor"
          className="shrink-0"
        />
        <span className="truncate">
          START ANALYSIS
        </span>
      </>
    );
  }

  return (
    <section
      className="
        w-full
        min-w-0
        overflow-hidden
        rounded-[clamp(12px,1vw,18px)]
        border
        border-slate-800
        bg-[#0b1627]/90
        p-[clamp(12px,1.25vw,20px)]
      "
    >
      <p
        className="
          mb-[clamp(12px,1.2vw,20px)]
          text-[clamp(11px,0.85vw,14px)]
          font-medium
          uppercase
          tracking-[0.08em]
          text-violet-300
        "
      >
        Input & Control
      </p>

      <form
        onSubmit={handleFormSubmit}
        className="
          flex
          min-w-0
          flex-col
          gap-[clamp(12px,1.2vw,20px)]
        "
      >
        <div className="min-w-0">
          <label
            htmlFor="stock-ticker"
            className="
              mb-[clamp(5px,0.5vw,8px)]
              block
              text-[clamp(12px,0.85vw,14px)]
              text-slate-200
            "
          >
            Stock Ticker
          </label>

          <input
            id="stock-ticker"
            type="text"
            value={ticker}
            onChange={handleTickerChange}
            disabled={isStreaming}
            maxLength={12}
            autoComplete="off"
            spellCheck={false}
            placeholder="Enter a stock ticker"
            className="
              w-full
              min-w-0
              rounded-[clamp(8px,0.7vw,12px)]
              border
              border-slate-700
              bg-[#08111f]
              px-[clamp(10px,1vw,16px)]
              py-[clamp(9px,0.8vw,12px)]
              text-[clamp(12px,0.85vw,14px)]
              text-white
              outline-none
              transition
              placeholder:text-slate-500
              focus:border-violet-500
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="analysis-query"
            className="
              mb-[clamp(5px,0.5vw,8px)]
              block
              text-[clamp(12px,0.85vw,14px)]
              text-slate-200
            "
          >
            User Query
          </label>

          <textarea
            id="analysis-query"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            disabled={isStreaming}
            placeholder="Describe what you want to analyze"
            className="
              h-[clamp(88px,12vh,112px)]
              w-full
              min-w-0
              resize-none
              rounded-[clamp(8px,0.7vw,12px)]
              border
              border-slate-700
              bg-[#08111f]
              px-[clamp(10px,1vw,16px)]
              py-[clamp(9px,0.8vw,12px)]
              text-[clamp(12px,0.85vw,14px)]
              leading-relaxed
              text-white
              outline-none
              transition
              placeholder:text-slate-500
              focus:border-violet-500
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          />
        </div>

        <button
          type="submit"
          disabled={
            isBackendUnavailable
              ? false
              : isSubmitDisabled
          }
          className="
            flex
            min-w-0
            w-full
            items-center
            justify-center
            gap-[clamp(6px,0.6vw,8px)]
            overflow-hidden
            rounded-[clamp(8px,0.7vw,12px)]
            bg-gradient-to-r
            from-violet-600
            to-purple-600
            px-[clamp(10px,1vw,16px)]
            py-[clamp(9px,0.8vw,12px)]
            text-[clamp(11px,0.8vw,14px)]
            font-semibold
            text-white
            transition
            hover:from-violet-500
            hover:to-purple-500
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {renderButtonContent()}
        </button>

        <BackendStatus
          status={backendStatus}
        />
      </form>
    </section>
  );
}