import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Clock3,
  CalendarDays,
  Tag,
  CircleCheck,
  CircleAlert,
  Copy,
  Download,
  Play,
  FileText,
  Activity,
  LoaderCircle,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const PAGE_SIZE = 6;

function formatDate(dateValue) {
  if (!dateValue) {
    return "--";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFullDate(dateValue) {
  if (!dateValue) {
    return "--";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(durationMs) {
  if (durationMs === null || durationMs === undefined) {
    return "--";
  }

  const milliseconds = Number(durationMs);

  if (Number.isNaN(milliseconds)) {
    return "--";
  }

  return `${(milliseconds / 1000).toFixed(1)}s`;
}

function normalizeStatus(status) {
  return String(status || "UNKNOWN").toUpperCase();
}

function getTickerInitial(ticker) {
  return String(ticker || "?").charAt(0).toUpperCase();
}

function StatusBadge({ status }) {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "SUCCESS") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
        <CircleCheck size={14} />
        Success
      </span>
    );
  }

  if (normalizedStatus === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
        <CircleAlert size={14} />
        Failed
      </span>
    );
  }

  if (normalizedStatus === "RUNNING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-400">
        <LoaderCircle size={14} className="animate-spin" />
        Running
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400">
      {normalizedStatus}
    </span>
  );
}

function MetadataItem({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <Icon size={17} className="mt-0.5 shrink-0 text-slate-500" />

      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="mt-1 break-words text-sm text-slate-200">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage({
  onModifyRun,
}) {
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("30_DAYS");
  const [sortOrder, setSortOrder] = useState("NEWEST");

  const [selectedRun, setSelectedRun] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("report");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadRuns() {
      try {
        setIsLoading(true);
        setLoadError("");

        const response = await fetch(`${API_BASE_URL}/api/analysis-runs`);

        if (!response.ok) {
          throw new Error(`Failed to load runs: ${response.status}`);
        }

        const payload = await response.json();

        const nextRuns = Array.isArray(payload)
          ? payload
          : payload.runs || payload.items || [];

        setRuns(nextRuns);
      } catch (error) {
        console.error("Failed to load analysis runs:", error);
        setLoadError(
          "Unable to load analysis history. Check that the backend is running.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadRuns();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter, sortOrder]);

  const filteredRuns = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const now = Date.now();

    const filtered = runs.filter((run) => {
      const ticker = String(run.ticker || "").toLowerCase();
      const userQuery = String(run.user_query || "").toLowerCase();
      const finalReport = String(run.final_report || "").toLowerCase();
      const status = normalizeStatus(run.status);

      const matchesSearch =
        !normalizedSearch ||
        ticker.includes(normalizedSearch) ||
        userQuery.includes(normalizedSearch) ||
        finalReport.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      const runDateValue =
        run.started_at || run.created_at || run.finished_at;

      const runDate = runDateValue
        ? new Date(runDateValue).getTime()
        : null;

      let matchesDate = true;

      if (dateFilter !== "ALL" && runDate) {
        const dayCount = dateFilter === "7_DAYS" ? 7 : 30;
        const cutoff = now - dayCount * 24 * 60 * 60 * 1000;

        matchesDate = runDate >= cutoff;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    return [...filtered].sort((left, right) => {
      const leftDate = new Date(
        left.started_at || left.created_at || 0,
      ).getTime();

      const rightDate = new Date(
        right.started_at || right.created_at || 0,
      ).getTime();

      if (sortOrder === "OLDEST") {
        return leftDate - rightDate;
      }

      if (sortOrder === "LONGEST") {
        return (
          Number(right.duration_ms || 0) -
          Number(left.duration_ms || 0)
        );
      }

      return rightDate - leftDate;
    });
  }, [
    runs,
    searchQuery,
    statusFilter,
    dateFilter,
    sortOrder,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRuns.length / PAGE_SIZE),
  );

  const paginatedRuns = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredRuns.slice(
      startIndex,
      startIndex + PAGE_SIZE,
    );
  }, [filteredRuns, currentPage]);

  function selectRun(run) {
    setSelectedRun(run);

    if (normalizeStatus(run.status) === "FAILED") {
      setActiveDetailTab("execution");
    } else {
      setActiveDetailTab("report");
    }
  }

  async function handleCopy() {
    if (!selectedRun?.final_report) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        selectedRun.final_report,
      );
    } catch (error) {
      console.error("Failed to copy report:", error);
    }
  }

  function handleExport() {
    if (!selectedRun?.final_report) {
      return;
    }

    const ticker = selectedRun.ticker || "report";
    const date = selectedRun.started_at
      ? new Date(selectedRun.started_at)
          .toISOString()
          .slice(0, 10)
      : "unknown-date";

    const content = [
      `# ${ticker} Financial Analysis`,
      "",
      `- Ticker: ${ticker}`,
      `- Query: ${selectedRun.user_query || "--"}`,
      `- Generated: ${formatFullDate(
        selectedRun.started_at ||
          selectedRun.created_at,
      )}`,
      `- Run ID: ${selectedRun.run_id || "--"}`,
      "",
      "---",
      "",
      selectedRun.final_report,
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/markdown;charset=utf-8",
    });

    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = `${ticker}_${date}_report.md`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(downloadUrl);
  }

  function handleModifyRun() {
    if (!selectedRun || !onModifyRun) {
      return;
    }

    onModifyRun({
      ticker: selectedRun.ticker,
      userQuery: selectedRun.user_query,
    });
  }

  const startResult =
    filteredRuns.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const endResult = Math.min(
    currentPage * PAGE_SIZE,
    filteredRuns.length,
  );

  return (
    <main className="min-h-0 flex-1 overflow-hidden">
      <div
        className={[
          "grid h-full min-h-0 gap-4",
          selectedRun
            ? "grid-cols-[minmax(0,1fr)_minmax(470px,0.64fr)]"
            : "grid-cols-1",
        ].join(" ")}
      >
        <section className="flex min-h-0 flex-col">
          <div className="mb-5">
            <h1 className="text-3xl font-bold text-white">
              History
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Review, search, and reopen previously generated
              analysis reports
            </p>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative min-w-[300px] flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search ticker, query, or report..."
                className="h-12 w-full rounded-xl border border-white/10 bg-[#0b1628] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
              />
            </div>

            <label className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="h-12 appearance-none rounded-xl border border-white/10 bg-[#0b1628] px-4 pr-10 text-sm text-slate-300 outline-none transition focus:border-cyan-400/50"
              >
                <option value="ALL">Status: All</option>
                <option value="SUCCESS">Status: Success</option>
                <option value="FAILED">Status: Failed</option>
                <option value="RUNNING">Status: Running</option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </label>

            <label className="relative">
              <select
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value)
                }
                className="h-12 appearance-none rounded-xl border border-white/10 bg-[#0b1628] px-4 pr-10 text-sm text-slate-300 outline-none transition focus:border-cyan-400/50"
              >
                <option value="7_DAYS">Date: Last 7 days</option>
                <option value="30_DAYS">
                  Date: Last 30 days
                </option>
                <option value="ALL">Date: All time</option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </label>

            <label className="relative">
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value)
                }
                className="h-12 appearance-none rounded-xl border border-white/10 bg-[#0b1628] px-4 pr-10 text-sm text-slate-300 outline-none transition focus:border-cyan-400/50"
              >
                <option value="NEWEST">
                  Sort: Newest first
                </option>
                <option value="OLDEST">
                  Sort: Oldest first
                </option>
                <option value="LONGEST">
                  Sort: Longest duration
                </option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </label>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1628]">
            <div className="grid grid-cols-[110px_minmax(220px,1fr)_120px_160px_100px_130px] gap-4 border-b border-white/10 px-5 py-4 text-xs font-medium uppercase tracking-wide text-slate-400">
              <div>Ticker</div>
              <div>Query</div>
              <div>Status</div>
              <div>Generated</div>
              <div>Duration</div>
              <div>Action</div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {isLoading && (
                <div className="flex h-full min-h-64 items-center justify-center">
                  <div className="text-center">
                    <LoaderCircle
                      size={30}
                      className="mx-auto animate-spin text-cyan-400"
                    />
                    <p className="mt-3 text-sm text-slate-400">
                      Loading analysis history...
                    </p>
                  </div>
                </div>
              )}

              {!isLoading && loadError && (
                <div className="flex h-full min-h-64 items-center justify-center px-6 text-center">
                  <div>
                    <CircleAlert
                      size={32}
                      className="mx-auto text-red-400"
                    />
                    <p className="mt-3 text-sm text-red-300">
                      {loadError}
                    </p>
                  </div>
                </div>
              )}

              {!isLoading &&
                !loadError &&
                filteredRuns.length === 0 && (
                  <div className="flex h-full min-h-64 items-center justify-center px-6 text-center">
                    <div>
                      <FileText
                        size={34}
                        className="mx-auto text-slate-600"
                      />

                      <p className="mt-3 font-medium text-slate-300">
                        No analysis runs found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or filters.
                      </p>
                    </div>
                  </div>
                )}

              {!isLoading &&
                !loadError &&
                paginatedRuns.map((run) => {
                  const isSelected =
                    selectedRun?.run_id === run.run_id;

                  return (
                    <button
                      key={run.run_id}
                      type="button"
                      onClick={() => selectRun(run)}
                      className={[
                        "mb-2 grid w-full grid-cols-[110px_minmax(220px,1fr)_120px_160px_100px_130px] items-center gap-4 rounded-xl border px-4 py-4 text-left transition",
                        isSelected
                          ? "border-purple-500 bg-purple-500/5 shadow-[inset_3px_0_0_#a855f7]"
                          : "border-white/5 bg-[#0d192c] hover:border-white/15 hover:bg-white/[0.04]",
                      ].join(" ")}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-bold text-cyan-300">
                          {getTickerInitial(run.ticker)}
                        </div>

                        <span className="truncate font-semibold text-white">
                          {run.ticker || "--"}
                        </span>
                      </div>

                      <div
                        className="truncate text-sm text-slate-300"
                        title={run.user_query}
                      >
                        {run.user_query || "--"}
                      </div>

                      <StatusBadge status={run.status} />

                      <div className="text-sm text-slate-300">
                        {formatDate(
                          run.started_at ||
                            run.created_at,
                        )}
                      </div>

                      <div className="text-sm text-slate-300">
                        {formatDuration(run.duration_ms)}
                      </div>

                      <div>
                        <span className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/15 bg-cyan-400/5 px-3 py-2 text-xs font-medium text-cyan-300">
                          {normalizeStatus(run.status) ===
                          "FAILED"
                            ? "View Details"
                            : "View Report"}

                          <ChevronRight size={15} />
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>

            {!isLoading &&
              !loadError &&
              filteredRuns.length > 0 && (
                <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
                  <div className="text-sm text-slate-400">
                    Showing {startResult}–{endResult} of{" "}
                    {filteredRuns.length} runs
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.max(1, page - 1),
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={17} />
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1,
                    )
                      .slice(0, 5)
                      .map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={[
                            "flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition",
                            currentPage === page
                              ? "border-purple-500 bg-purple-500/10 text-purple-300"
                              : "border-white/10 text-slate-300 hover:bg-white/10",
                          ].join(" ")}
                        >
                          {page}
                        </button>
                      ))}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(totalPages, page + 1),
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              )}
          </div>
        </section>

        {selectedRun && (
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1628] p-4">
            <div className="flex items-start justify-between gap-4 px-1 pb-4">
              <h2 className="text-xl font-bold leading-tight text-white">
                {selectedRun.ticker} Financial Analysis
              </h2>

              <button
                type="button"
                onClick={() => setSelectedRun(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={21} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-7 gap-y-5 rounded-xl border border-white/10 bg-[#0d192c] p-4">
              <MetadataItem icon={Tag} label="Ticker">
                {selectedRun.ticker || "--"}
              </MetadataItem>

              <MetadataItem icon={Clock3} label="Duration">
                {formatDuration(selectedRun.duration_ms)}
              </MetadataItem>

              <MetadataItem icon={FileText} label="Query">
                {selectedRun.user_query || "--"}
              </MetadataItem>

              <MetadataItem icon={Tag} label="Run ID">
                {selectedRun.run_id || "--"}
              </MetadataItem>

              <MetadataItem
                icon={CalendarDays}
                label="Generated"
              >
                {formatFullDate(
                  selectedRun.started_at ||
                    selectedRun.created_at,
                )}
              </MetadataItem>

              <MetadataItem
                icon={
                  normalizeStatus(selectedRun.status) ===
                  "FAILED"
                    ? CircleAlert
                    : CircleCheck
                }
                label="Status"
              >
                <StatusBadge status={selectedRun.status} />
              </MetadataItem>
            </div>

            <div className="mt-4 flex border-b border-white/10">
              <button
                type="button"
                onClick={() => setActiveDetailTab("report")}
                className={[
                  "border-b-2 px-5 py-3 text-sm font-medium transition",
                  activeDetailTab === "report"
                    ? "border-purple-500 text-white"
                    : "border-transparent text-slate-400 hover:text-white",
                ].join(" ")}
              >
                Report
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveDetailTab("execution")
                }
                className={[
                  "border-b-2 px-5 py-3 text-sm font-medium transition",
                  activeDetailTab === "execution"
                    ? "border-purple-500 text-white"
                    : "border-transparent text-slate-400 hover:text-white",
                ].join(" ")}
              >
                Execution Details
              </button>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-[#08111f] p-5">
              {activeDetailTab === "report" && (
                <>
                  {selectedRun.final_report ? (
                    <div className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                      {selectedRun.final_report}
                    </div>
                  ) : (
                    <div className="flex h-full min-h-48 items-center justify-center text-center">
                      <div>
                        <FileText
                          size={32}
                          className="mx-auto text-slate-600"
                        />

                        <p className="mt-3 text-sm text-slate-400">
                          No report was generated for this run.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeDetailTab === "execution" && (
                <div className="space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Current node
                    </div>
                    <div className="mt-2 text-sm text-slate-200">
                      {selectedRun.current_node || "--"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Started at
                    </div>
                    <div className="mt-2 text-sm text-slate-200">
                      {formatFullDate(
                        selectedRun.started_at,
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Finished at
                    </div>
                    <div className="mt-2 text-sm text-slate-200">
                      {formatFullDate(
                        selectedRun.finished_at,
                      )}
                    </div>
                  </div>

                  {selectedRun.error_message && (
                    <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-300">
                        <CircleAlert size={17} />
                        Error message
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-red-200/80">
                        {selectedRun.error_message}
                      </p>
                    </div>
                  )}

                  {!selectedRun.error_message && (
                    <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/5 p-4">
                      <div className="flex items-center gap-2 text-sm text-emerald-300">
                        <Activity size={17} />
                        Run completed without a recorded error.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!selectedRun.final_report}
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Copy size={17} />
                  Copy
                </button>

                <button
                  type="button"
                  disabled={!selectedRun.final_report}
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download size={17} />
                  Export
                </button>
              </div>

              <button
                type="button"
                onClick={handleModifyRun}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                <Play size={17} fill="currentColor" />
                Modify & Run
              </button>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}