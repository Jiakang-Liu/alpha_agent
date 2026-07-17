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
        "flex min-w-0 items-start gap-3 rounded-xl border px-4 py-3",
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
        <div className="truncate text-sm font-medium text-slate-200">
          {config.title}
        </div>

        <div className="mt-0.5 break-words text-xs leading-relaxed text-slate-500">
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
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1627]/90 p-4 2xl:p-5">
      <p className="mb-4 text-sm font-medium uppercase tracking-wide text-violet-300">
        Input & Control
      </p>

      <form
        onSubmit={handleFormSubmit}
        className="flex min-w-0 flex-col gap-4"
      >
        <div className="min-w-0">
          <label
            htmlFor="stock-ticker"
            className="mb-2 block text-sm text-slate-200"
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
            className="h-11 w-full min-w-0 rounded-lg border border-slate-700 bg-[#08111f] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="analysis-query"
            className="mb-2 block text-sm text-slate-200"
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
            className="h-24 w-full min-w-0 resize-none rounded-lg border border-slate-700 bg-[#08111f] px-4 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-60 2xl:h-28"
          />
        </div>

        <button
          type="submit"
          disabled={
            isBackendUnavailable
              ? false
              : isSubmitDisabled
          }
          className="flex h-11 w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
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