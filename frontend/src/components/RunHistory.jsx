import { useEffect, useState } from "react";

export default function RunHistory({ refreshKey }) {
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchRuns() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch("http://localhost:8000/api/analysis-runs");

        if (!response.ok) {
          throw new Error(`Failed to fetch runs: ${response.status}`);
        }

        const data = await response.json();
        setRuns(data.runs ?? []);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRuns();
  }, [refreshKey]);

  const visibleRuns = expanded ? runs : runs.slice(0, 3);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b1628] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Run History
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Recent persisted analysis runs
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
        >
          {expanded ? "Collapse" : "View All"}
        </button>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
          Loading runs...
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && visibleRuns.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
          No runs found.
        </div>
      )}

      <div className="space-y-3">
        {visibleRuns.map((run) => (
          <RunHistoryItem key={run.run_id} run={run} />
        ))}
      </div>
    </section>
  );
}

function RunHistoryItem({ run }) {
  const statusStyle =
    run.status === "SUCCESS"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : run.status === "FAILED"
      ? "border-red-400/30 bg-red-400/10 text-red-300"
      : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";

  return (
    <article className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-white">
              {run.ticker}
            </h3>

            <span
              className={[
                "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                statusStyle,
              ].join(" ")}
            >
              {run.status}
            </span>
          </div>

          <p className="mt-1 line-clamp-1 text-xs text-slate-400">
            {run.user_query}
          </p>
        </div>
        

        <div className="shrink-0 text-right text-xs text-slate-500">
          {formatDuration(run.duration_ms)}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
        <div>
          <div className="text-slate-600">Node</div>
          <div className="truncate text-slate-300">
            {run.current_node ?? "--"}
          </div>
        </div>

        <div>
          <div className="text-slate-600">Started</div>
          <div className="truncate text-slate-300">
            {formatDate(run.started_at)}
          </div>
        </div>

        <div>
          <div className="text-slate-600">Run ID</div>
          <div className="truncate text-slate-300">
            {run.run_id?.slice(0, 8)}
          </div>
        </div>
      </div>

      {run.error_message && (
        <div className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 p-2 text-xs text-red-300">
          {run.error_message}
        </div>
      )}
    </article>
  );
}

function formatDuration(durationMs) {
  if (!durationMs) return "--";

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(1)}s`;
}

function formatDate(value) {
  if (!value) return "--";

  return new Date(value).toLocaleString();
}