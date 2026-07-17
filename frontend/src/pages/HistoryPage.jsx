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
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

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
  if (
    durationMs === null ||
    durationMs === undefined
  ) {
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
  return String(ticker || "?")
    .charAt(0)
    .toUpperCase();
}

function StatusBadge({ status }) {
  const normalizedStatus = normalizeStatus(status);

  const baseClassName = `
    inline-flex
    shrink-0
    items-center
    gap-[clamp(4px,0.4vw,6px)]
    rounded-[clamp(7px,0.6vw,10px)]
    border
    px-[clamp(7px,0.7vw,10px)]
    py-[clamp(4px,0.4vw,5px)]
    text-[clamp(10px,0.72vw,12px)]
    font-medium
  `;

  if (normalizedStatus === "SUCCESS") {
    return (
      <span
        className={`${baseClassName} border-emerald-400/20 bg-emerald-500/10 text-emerald-400`}
      >
        <CircleCheck
          className="h-[clamp(12px,1vw,14px)] w-[clamp(12px,1vw,14px)]"
        />
        Success
      </span>
    );
  }

  if (normalizedStatus === "FAILED") {
    return (
      <span
        className={`${baseClassName} border-red-400/20 bg-red-500/10 text-red-400`}
      >
        <CircleAlert
          className="h-[clamp(12px,1vw,14px)] w-[clamp(12px,1vw,14px)]"
        />
        Failed
      </span>
    );
  }

  if (normalizedStatus === "RUNNING") {
    return (
      <span
        className={`${baseClassName} border-cyan-400/20 bg-cyan-500/10 text-cyan-400`}
      >
        <LoaderCircle
          className="
            h-[clamp(12px,1vw,14px)]
            w-[clamp(12px,1vw,14px)]
            animate-spin
          "
        />
        Running
      </span>
    );
  }

  return (
    <span
      className={`${baseClassName} border-white/10 bg-white/5 text-slate-400`}
    >
      {normalizedStatus}
    </span>
  );
}

function MetadataItem({
  icon: Icon,
  label,
  children,
}) {
  return (
    <div
      className="
        flex
        min-w-0
        gap-[clamp(7px,0.7vw,12px)]
      "
    >
      <Icon
        className="
          mt-0.5
          h-[clamp(14px,1.15vw,17px)]
          w-[clamp(14px,1.15vw,17px)]
          shrink-0
          text-slate-500
        "
      />

      <div className="min-w-0 flex-1">
        <div
          className="
            text-[clamp(10px,0.72vw,12px)]
            text-slate-500
          "
        >
          {label}
        </div>

        <div
          className="
            mt-[clamp(3px,0.35vw,5px)]
            break-words
            text-[clamp(12px,0.85vw,14px)]
            text-slate-200
          "
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
  ariaLabel,
}) {
  return (
    <label
      className="
        relative
        min-w-[clamp(145px,13vw,210px)]
        flex-1
        lg:flex-none
      "
    >
      <select
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        className="
          h-[clamp(40px,4vw,48px)]
          w-full
          appearance-none
          rounded-[clamp(9px,0.75vw,12px)]
          border
          border-white/10
          bg-[#0b1628]
          px-[clamp(10px,1vw,16px)]
          pr-[clamp(32px,3vw,40px)]
          text-[clamp(11px,0.8vw,14px)]
          text-slate-300
          outline-none
          transition
          focus:border-cyan-400/50
        "
      >
        {children}
      </select>

      <ChevronDown
        className="
          pointer-events-none
          absolute
          right-[clamp(9px,0.8vw,12px)]
          top-1/2
          h-[clamp(14px,1.1vw,16px)]
          w-[clamp(14px,1.1vw,16px)]
          -translate-y-1/2
          text-slate-500
        "
      />
    </label>
  );
}

function ActionButton({
  icon: Icon,
  children,
  onClick,
  disabled,
  primary = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex shrink-0 items-center justify-center",
        "gap-[clamp(5px,0.5vw,8px)]",
        "rounded-[clamp(8px,0.7vw,12px)]",
        "px-[clamp(9px,0.9vw,16px)]",
        "py-[clamp(7px,0.7vw,10px)]",
        "text-[clamp(11px,0.8vw,14px)]",
        "transition",
        "disabled:cursor-not-allowed",
        "disabled:opacity-40",
        primary
          ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 font-semibold text-white hover:brightness-110"
          : "border border-white/10 text-slate-200 hover:bg-white/10",
      ].join(" ")}
    >
      <Icon
        className="
          h-[clamp(14px,1.15vw,17px)]
          w-[clamp(14px,1.15vw,17px)]
          shrink-0
        "
        fill={primary ? "currentColor" : "none"}
      />

      <span className="whitespace-nowrap">
        {children}
      </span>
    </button>
  );
}

export default function HistoryPage({
  onModifyRun,
}) {
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [loadError, setLoadError] =
    useState("");

  const [searchQuery, setSearchQuery] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [dateFilter, setDateFilter] =
    useState("30_DAYS");
  const [sortOrder, setSortOrder] =
    useState("NEWEST");

  const [selectedRun, setSelectedRun] =
    useState(null);

  const [activeDetailTab, setActiveDetailTab] =
    useState("report");

  const [currentPage, setCurrentPage] =
    useState(1);

  useEffect(() => {
    async function loadRuns() {
      try {
        setIsLoading(true);
        setLoadError("");

        const response = await fetch(
          `${API_BASE_URL}/api/analysis-runs`,
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load runs: ${response.status}`,
          );
        }

        const payload = await response.json();

        const nextRuns = Array.isArray(payload)
          ? payload
          : payload.runs ||
            payload.items ||
            [];

        setRuns(nextRuns);
      } catch (error) {
        console.error(
          "Failed to load analysis runs:",
          error,
        );

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
  }, [
    searchQuery,
    statusFilter,
    dateFilter,
    sortOrder,
  ]);

  const filteredRuns = useMemo(() => {
    const normalizedSearch =
      searchQuery.trim().toLowerCase();

    const now = Date.now();

    const filtered = runs.filter((run) => {
      const ticker = String(
        run.ticker || "",
      ).toLowerCase();

      const userQuery = String(
        run.user_query || "",
      ).toLowerCase();

      const finalReport = String(
        run.final_report || "",
      ).toLowerCase();

      const status = normalizeStatus(
        run.status,
      );

      const matchesSearch =
        !normalizedSearch ||
        ticker.includes(normalizedSearch) ||
        userQuery.includes(normalizedSearch) ||
        finalReport.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter;

      const runDateValue =
        run.started_at ||
        run.created_at ||
        run.finished_at;

      const runDate = runDateValue
        ? new Date(runDateValue).getTime()
        : null;

      let matchesDate = true;

      if (
        dateFilter !== "ALL" &&
        runDate
      ) {
        const dayCount =
          dateFilter === "7_DAYS"
            ? 7
            : 30;

        const cutoff =
          now -
          dayCount *
            24 *
            60 *
            60 *
            1000;

        matchesDate = runDate >= cutoff;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate
      );
    });

    return [...filtered].sort(
      (left, right) => {
        const leftDate = new Date(
          left.started_at ||
            left.created_at ||
            0,
        ).getTime();

        const rightDate = new Date(
          right.started_at ||
            right.created_at ||
            0,
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
      },
    );
  }, [
    runs,
    searchQuery,
    statusFilter,
    dateFilter,
    sortOrder,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRuns.length / PAGE_SIZE,
    ),
  );

  const paginatedRuns = useMemo(() => {
    const startIndex =
      (currentPage - 1) * PAGE_SIZE;

    return filteredRuns.slice(
      startIndex,
      startIndex + PAGE_SIZE,
    );
  }, [filteredRuns, currentPage]);

  function selectRun(run) {
    setSelectedRun(run);

    if (
      normalizeStatus(run.status) ===
      "FAILED"
    ) {
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
      console.error(
        "Failed to copy report:",
        error,
      );
    }
  }

  function handleExport() {
    if (!selectedRun?.final_report) {
      return;
    }

    const ticker =
      selectedRun.ticker || "report";

    const date = selectedRun.started_at
      ? new Date(
          selectedRun.started_at,
        )
          .toISOString()
          .slice(0, 10)
      : "unknown-date";

    const content = [
      `# ${ticker} Financial Analysis`,
      "",
      `- Ticker: ${ticker}`,
      `- Query: ${
        selectedRun.user_query || "--"
      }`,
      `- Generated: ${formatFullDate(
        selectedRun.started_at ||
          selectedRun.created_at,
      )}`,
      `- Run ID: ${
        selectedRun.run_id || "--"
      }`,
      "",
      "---",
      "",
      selectedRun.final_report,
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/markdown;charset=utf-8",
    });

    const downloadUrl =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = `${ticker}_${date}_report.md`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(downloadUrl);
  }

  function handleModifyRun() {
    if (
      !selectedRun ||
      !onModifyRun
    ) {
      return;
    }

    onModifyRun({
      ticker: selectedRun.ticker,
      userQuery:
        selectedRun.user_query,
    });
  }

  const startResult =
    filteredRuns.length === 0
      ? 0
      : (currentPage - 1) *
          PAGE_SIZE +
        1;

  const endResult = Math.min(
    currentPage * PAGE_SIZE,
    filteredRuns.length,
  );

  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).slice(
    Math.max(0, currentPage - 3),
    Math.min(
      totalPages,
      Math.max(5, currentPage + 2),
    ),
  );

  return (
    <main
      className="
        h-full
        min-h-0
        min-w-0
        overflow-hidden
      "
    >
      <div
        className={[
          "grid h-full min-h-0 min-w-0",
          "gap-[clamp(8px,1vw,16px)]",
          "overflow-y-auto overflow-x-hidden",
          selectedRun
            ? [
                "grid-cols-1",
                "2xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.65fr)]",
                "2xl:overflow-hidden",
              ].join(" ")
            : "grid-cols-1 overflow-hidden",
        ].join(" ")}
      >
        <section
          className="
            flex
            min-h-[600px]
            min-w-0
            flex-col
            2xl:min-h-0
          "
        >
          <div
            className="
              mb-[clamp(12px,1.3vw,20px)]
              shrink-0
            "
          >
            <h1
              className="
                text-[clamp(24px,2.2vw,34px)]
                font-bold
                leading-tight
                text-white
              "
            >
              History
            </h1>

            <p
              className="
                mt-[clamp(3px,0.4vw,6px)]
                text-[clamp(11px,0.85vw,14px)]
                text-slate-400
              "
            >
              Review, search, and reopen previously
              generated analysis reports
            </p>
          </div>

          <div
            className="
              mb-[clamp(10px,1vw,16px)]
              flex
              shrink-0
              flex-wrap
              gap-[clamp(7px,0.7vw,12px)]
            "
          >
            <div
              className="
                relative
                min-w-[min(100%,240px)]
                flex-[2_1_320px]
              "
            >
              <Search
                className="
                  absolute
                  left-[clamp(10px,1vw,16px)]
                  top-1/2
                  h-[clamp(16px,1.3vw,19px)]
                  w-[clamp(16px,1.3vw,19px)]
                  -translate-y-1/2
                  text-slate-500
                "
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value,
                  )
                }
                placeholder="Search ticker, query, or report..."
                className="
                  h-[clamp(40px,4vw,48px)]
                  w-full
                  rounded-[clamp(9px,0.75vw,12px)]
                  border
                  border-white/10
                  bg-[#0b1628]
                  pl-[clamp(38px,3.5vw,48px)]
                  pr-[clamp(10px,1vw,16px)]
                  text-[clamp(11px,0.8vw,14px)]
                  text-white
                  outline-none
                  transition
                  placeholder:text-slate-500
                  focus:border-cyan-400/50
                "
              />
            </div>

            <FilterSelect
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              ariaLabel="Filter by status"
            >
              <option value="ALL">
                Status: All
              </option>
              <option value="SUCCESS">
                Status: Success
              </option>
              <option value="FAILED">
                Status: Failed
              </option>
              <option value="RUNNING">
                Status: Running
              </option>
            </FilterSelect>

            <FilterSelect
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target.value,
                )
              }
              ariaLabel="Filter by date"
            >
              <option value="7_DAYS">
                Date: Last 7 days
              </option>
              <option value="30_DAYS">
                Date: Last 30 days
              </option>
              <option value="ALL">
                Date: All time
              </option>
            </FilterSelect>

            <FilterSelect
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value,
                )
              }
              ariaLabel="Sort analysis runs"
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
            </FilterSelect>
          </div>

          <div
            className="
              flex
              min-h-0
              min-w-0
              flex-1
              flex-col
              overflow-hidden
              rounded-[clamp(12px,1vw,18px)]
              border
              border-white/10
              bg-[#0b1628]
            "
          >
            <div
              className="
                min-w-0
                shrink-0
                overflow-x-auto
                border-b
                border-white/10
              "
            >
              <div
                className="
                  grid
                  min-w-[820px]
                  grid-cols-[clamp(100px,9vw,130px)_minmax(220px,1fr)_clamp(105px,9vw,130px)_clamp(135px,12vw,175px)_clamp(85px,7vw,110px)_clamp(115px,10vw,145px)]
                  gap-[clamp(8px,1vw,16px)]
                  px-[clamp(12px,1.3vw,20px)]
                  py-[clamp(10px,1vw,16px)]
                  text-[clamp(10px,0.72vw,12px)]
                  font-medium
                  uppercase
                  tracking-[0.06em]
                  text-slate-400
                "
              >
                <div>Ticker</div>
                <div>Query</div>
                <div>Status</div>
                <div>Generated</div>
                <div>Duration</div>
                <div>Action</div>
              </div>
            </div>

            <div
              className="
                min-h-0
                min-w-0
                flex-1
                overflow-auto
                p-[clamp(6px,0.6vw,10px)]
              "
            >
              {isLoading && (
                <div
                  className="
                    flex
                    h-full
                    min-h-[clamp(220px,32vh,320px)]
                    items-center
                    justify-center
                  "
                >
                  <div className="text-center">
                    <LoaderCircle
                      className="
                        mx-auto
                        h-[clamp(25px,2.2vw,32px)]
                        w-[clamp(25px,2.2vw,32px)]
                        animate-spin
                        text-cyan-400
                      "
                    />

                    <p
                      className="
                        mt-[clamp(8px,0.8vw,12px)]
                        text-[clamp(11px,0.85vw,14px)]
                        text-slate-400
                      "
                    >
                      Loading analysis history...
                    </p>
                  </div>
                </div>
              )}

              {!isLoading &&
                loadError && (
                  <div
                    className="
                      flex
                      h-full
                      min-h-[clamp(220px,32vh,320px)]
                      items-center
                      justify-center
                      px-[clamp(16px,2vw,32px)]
                      text-center
                    "
                  >
                    <div>
                      <CircleAlert
                        className="
                          mx-auto
                          h-[clamp(27px,2.3vw,34px)]
                          w-[clamp(27px,2.3vw,34px)]
                          text-red-400
                        "
                      />

                      <p
                        className="
                          mt-[clamp(8px,0.8vw,12px)]
                          text-[clamp(11px,0.85vw,14px)]
                          text-red-300
                        "
                      >
                        {loadError}
                      </p>
                    </div>
                  </div>
                )}

              {!isLoading &&
                !loadError &&
                filteredRuns.length === 0 && (
                  <div
                    className="
                      flex
                      h-full
                      min-h-[clamp(220px,32vh,320px)]
                      items-center
                      justify-center
                      px-[clamp(16px,2vw,32px)]
                      text-center
                    "
                  >
                    <div>
                      <FileText
                        className="
                          mx-auto
                          h-[clamp(28px,2.4vw,36px)]
                          w-[clamp(28px,2.4vw,36px)]
                          text-slate-600
                        "
                      />

                      <p
                        className="
                          mt-[clamp(8px,0.8vw,12px)]
                          text-[clamp(13px,0.95vw,16px)]
                          font-medium
                          text-slate-300
                        "
                      >
                        No analysis runs found
                      </p>

                      <p
                        className="
                          mt-[clamp(3px,0.35vw,5px)]
                          text-[clamp(11px,0.8vw,14px)]
                          text-slate-500
                        "
                      >
                        Try changing your search or
                        filters.
                      </p>
                    </div>
                  </div>
                )}

              {!isLoading &&
                !loadError && (
                  <div className="min-w-[820px]">
                    {paginatedRuns.map(
                      (run) => {
                        const isSelected =
                          selectedRun?.run_id ===
                          run.run_id;

                        return (
                          <button
                            key={run.run_id}
                            type="button"
                            onClick={() =>
                              selectRun(run)
                            }
                            className={[
                              "mb-[clamp(6px,0.6vw,10px)]",
                              "grid w-full",
                              "grid-cols-[clamp(100px,9vw,130px)_minmax(220px,1fr)_clamp(105px,9vw,130px)_clamp(135px,12vw,175px)_clamp(85px,7vw,110px)_clamp(115px,10vw,145px)]",
                              "items-center",
                              "gap-[clamp(8px,1vw,16px)]",
                              "rounded-[clamp(9px,0.8vw,13px)]",
                              "border",
                              "px-[clamp(10px,1vw,16px)]",
                              "py-[clamp(10px,1vw,16px)]",
                              "text-left",
                              "transition",
                              isSelected
                                ? "border-purple-500 bg-purple-500/5 shadow-[inset_3px_0_0_#a855f7]"
                                : "border-white/5 bg-[#0d192c] hover:border-white/15 hover:bg-white/[0.04]",
                            ].join(" ")}
                          >
                            <div
                              className="
                                flex
                                min-w-0
                                items-center
                                gap-[clamp(7px,0.7vw,12px)]
                              "
                            >
                              <div
                                className="
                                  flex
                                  h-[clamp(32px,3vw,40px)]
                                  w-[clamp(32px,3vw,40px)]
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-cyan-500/10
                                  text-[clamp(11px,0.85vw,14px)]
                                  font-bold
                                  text-cyan-300
                                "
                              >
                                {getTickerInitial(
                                  run.ticker,
                                )}
                              </div>

                              <span
                                className="
                                  min-w-0
                                  truncate
                                  text-[clamp(12px,0.9vw,15px)]
                                  font-semibold
                                  text-white
                                "
                              >
                                {run.ticker ||
                                  "--"}
                              </span>
                            </div>

                            <div
                              className="
                                truncate
                                text-[clamp(11px,0.85vw,14px)]
                                text-slate-300
                              "
                              title={
                                run.user_query
                              }
                            >
                              {run.user_query ||
                                "--"}
                            </div>

                            <StatusBadge
                              status={run.status}
                            />

                            <div
                              className="
                                truncate
                                text-[clamp(11px,0.85vw,14px)]
                                text-slate-300
                              "
                            >
                              {formatDate(
                                run.started_at ||
                                  run.created_at,
                              )}
                            </div>

                            <div
                              className="
                                text-[clamp(11px,0.85vw,14px)]
                                text-slate-300
                              "
                            >
                              {formatDuration(
                                run.duration_ms,
                              )}
                            </div>

                            <div>
                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-[clamp(4px,0.4vw,8px)]
                                  rounded-[clamp(7px,0.6vw,10px)]
                                  border
                                  border-cyan-400/15
                                  bg-cyan-400/5
                                  px-[clamp(7px,0.7vw,12px)]
                                  py-[clamp(6px,0.6vw,9px)]
                                  text-[clamp(10px,0.72vw,12px)]
                                  font-medium
                                  text-cyan-300
                                "
                              >
                                {normalizeStatus(
                                  run.status,
                                ) === "FAILED"
                                  ? "View Details"
                                  : "View Report"}

                                <ChevronRight
                                  className="
                                    h-[clamp(13px,1vw,15px)]
                                    w-[clamp(13px,1vw,15px)]
                                  "
                                />
                              </span>
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
            </div>

            {!isLoading &&
              !loadError &&
              filteredRuns.length > 0 && (
                <div
                  className="
                    flex
                    shrink-0
                    flex-wrap
                    items-center
                    justify-between
                    gap-[clamp(8px,0.8vw,12px)]
                    border-t
                    border-white/10
                    px-[clamp(12px,1.3vw,20px)]
                    py-[clamp(10px,1vw,16px)]
                  "
                >
                  <div
                    className="
                      text-[clamp(10px,0.8vw,14px)]
                      text-slate-400
                    "
                  >
                    Showing {startResult}–
                    {endResult} of{" "}
                    {filteredRuns.length} runs
                  </div>

                  <div
                    className="
                      flex
                      items-center
                      gap-[clamp(4px,0.45vw,8px)]
                    "
                  >
                    <button
                      type="button"
                      aria-label="Previous page"
                      disabled={
                        currentPage === 1
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.max(
                              1,
                              page - 1,
                            ),
                        )
                      }
                      className="
                        flex
                        h-[clamp(30px,2.8vw,36px)]
                        w-[clamp(30px,2.8vw,36px)]
                        items-center
                        justify-center
                        rounded-[clamp(7px,0.6vw,10px)]
                        border
                        border-white/10
                        text-slate-300
                        transition
                        hover:bg-white/10
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >
                      <ChevronLeft
                        className="
                          h-[clamp(14px,1.15vw,17px)]
                          w-[clamp(14px,1.15vw,17px)]
                        "
                      />
                    </button>

                    {visiblePages.map(
                      (page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() =>
                            setCurrentPage(
                              page,
                            )
                          }
                          className={[
                            "flex",
                            "h-[clamp(30px,2.8vw,36px)]",
                            "w-[clamp(30px,2.8vw,36px)]",
                            "items-center",
                            "justify-center",
                            "rounded-[clamp(7px,0.6vw,10px)]",
                            "border",
                            "text-[clamp(11px,0.8vw,14px)]",
                            "transition",
                            currentPage ===
                            page
                              ? "border-purple-500 bg-purple-500/10 text-purple-300"
                              : "border-white/10 text-slate-300 hover:bg-white/10",
                          ].join(" ")}
                        >
                          {page}
                        </button>
                      ),
                    )}

                    <button
                      type="button"
                      aria-label="Next page"
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.min(
                              totalPages,
                              page + 1,
                            ),
                        )
                      }
                      className="
                        flex
                        h-[clamp(30px,2.8vw,36px)]
                        w-[clamp(30px,2.8vw,36px)]
                        items-center
                        justify-center
                        rounded-[clamp(7px,0.6vw,10px)]
                        border
                        border-white/10
                        text-slate-300
                        transition
                        hover:bg-white/10
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >
                      <ChevronRight
                        className="
                          h-[clamp(14px,1.15vw,17px)]
                          w-[clamp(14px,1.15vw,17px)]
                        "
                      />
                    </button>
                  </div>
                </div>
              )}
          </div>
        </section>

        {selectedRun && (
          <aside
            className="
              flex
              min-h-[620px]
              min-w-0
              flex-col
              overflow-hidden
              rounded-[clamp(12px,1vw,18px)]
              border
              border-white/10
              bg-[#0b1628]
              p-[clamp(10px,1vw,16px)]
              2xl:min-h-0
            "
          >
            <div
              className="
                flex
                min-w-0
                shrink-0
                items-start
                justify-between
                gap-[clamp(8px,1vw,16px)]
                px-[clamp(2px,0.25vw,4px)]
                pb-[clamp(10px,1vw,16px)]
              "
            >
              <h2
                className="
                  min-w-0
                  flex-1
                  truncate
                  text-[clamp(17px,1.5vw,22px)]
                  font-bold
                  leading-tight
                  text-white
                "
              >
                {selectedRun.ticker} Financial
                Analysis
              </h2>

              <button
                type="button"
                onClick={() =>
                  setSelectedRun(null)
                }
                aria-label="Close run details"
                className="
                  shrink-0
                  rounded-[clamp(7px,0.6vw,10px)]
                  p-[clamp(6px,0.6vw,8px)]
                  text-slate-400
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                <X
                  className="
                    h-[clamp(17px,1.4vw,21px)]
                    w-[clamp(17px,1.4vw,21px)]
                  "
                />
              </button>
            </div>

            <div
              className="
                grid
                shrink-0
                grid-cols-1
                gap-[clamp(12px,1.3vw,20px)]
                rounded-[clamp(9px,0.8vw,13px)]
                border
                border-white/10
                bg-[#0d192c]
                p-[clamp(10px,1vw,16px)]
                sm:grid-cols-2
              "
            >
              <MetadataItem
                icon={Tag}
                label="Ticker"
              >
                {selectedRun.ticker || "--"}
              </MetadataItem>

              <MetadataItem
                icon={Clock3}
                label="Duration"
              >
                {formatDuration(
                  selectedRun.duration_ms,
                )}
              </MetadataItem>

              <MetadataItem
                icon={FileText}
                label="Query"
              >
                {selectedRun.user_query ||
                  "--"}
              </MetadataItem>

              <MetadataItem
                icon={Tag}
                label="Run ID"
              >
                <span className="break-all">
                  {selectedRun.run_id || "--"}
                </span>
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
                  normalizeStatus(
                    selectedRun.status,
                  ) === "FAILED"
                    ? CircleAlert
                    : CircleCheck
                }
                label="Status"
              >
                <StatusBadge
                  status={selectedRun.status}
                />
              </MetadataItem>
            </div>

            <div
              className="
                mt-[clamp(10px,1vw,16px)]
                flex
                shrink-0
                overflow-x-auto
                border-b
                border-white/10
              "
            >
              <button
                type="button"
                onClick={() =>
                  setActiveDetailTab(
                    "report",
                  )
                }
                className={[
                  "shrink-0 border-b-2",
                  "px-[clamp(12px,1.2vw,20px)]",
                  "py-[clamp(8px,0.8vw,12px)]",
                  "text-[clamp(11px,0.85vw,14px)]",
                  "font-medium transition",
                  activeDetailTab ===
                  "report"
                    ? "border-purple-500 text-white"
                    : "border-transparent text-slate-400 hover:text-white",
                ].join(" ")}
              >
                Report
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveDetailTab(
                    "execution",
                  )
                }
                className={[
                  "shrink-0 border-b-2",
                  "px-[clamp(12px,1.2vw,20px)]",
                  "py-[clamp(8px,0.8vw,12px)]",
                  "text-[clamp(11px,0.85vw,14px)]",
                  "font-medium transition",
                  activeDetailTab ===
                  "execution"
                    ? "border-purple-500 text-white"
                    : "border-transparent text-slate-400 hover:text-white",
                ].join(" ")}
              >
                Execution Details
              </button>
            </div>

            <div
              className="
                mt-[clamp(10px,1vw,16px)]
                min-h-0
                min-w-0
                flex-1
                overflow-y-auto
                overflow-x-hidden
                rounded-[clamp(9px,0.8vw,13px)]
                border
                border-white/10
                bg-[#08111f]
                p-[clamp(12px,1.3vw,20px)]
              "
            >
              {activeDetailTab ===
                "report" && (
                <>
                  {selectedRun.final_report ? (
                    <div
                      className="
                        whitespace-pre-wrap
                        break-words
                        text-[clamp(12px,0.85vw,14px)]
                        leading-[1.75]
                        text-slate-300
                      "
                    >
                      {
                        selectedRun.final_report
                      }
                    </div>
                  ) : (
                    <div
                      className="
                        flex
                        h-full
                        min-h-[clamp(180px,24vh,260px)]
                        items-center
                        justify-center
                        text-center
                      "
                    >
                      <div>
                        <FileText
                          className="
                            mx-auto
                            h-[clamp(27px,2.3vw,34px)]
                            w-[clamp(27px,2.3vw,34px)]
                            text-slate-600
                          "
                        />

                        <p
                          className="
                            mt-[clamp(8px,0.8vw,12px)]
                            text-[clamp(11px,0.85vw,14px)]
                            text-slate-400
                          "
                        >
                          No report was generated for
                          this run.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeDetailTab ===
                "execution" && (
                <div
                  className="
                    space-y-[clamp(14px,1.4vw,20px)]
                  "
                >
                  <div>
                    <div
                      className="
                        text-[clamp(10px,0.72vw,12px)]
                        uppercase
                        tracking-[0.06em]
                        text-slate-500
                      "
                    >
                      Current node
                    </div>

                    <div
                      className="
                        mt-[clamp(5px,0.6vw,8px)]
                        break-words
                        text-[clamp(12px,0.85vw,14px)]
                        text-slate-200
                      "
                    >
                      {selectedRun.current_node ||
                        "--"}
                    </div>
                  </div>

                  <div>
                    <div
                      className="
                        text-[clamp(10px,0.72vw,12px)]
                        uppercase
                        tracking-[0.06em]
                        text-slate-500
                      "
                    >
                      Started at
                    </div>

                    <div
                      className="
                        mt-[clamp(5px,0.6vw,8px)]
                        text-[clamp(12px,0.85vw,14px)]
                        text-slate-200
                      "
                    >
                      {formatFullDate(
                        selectedRun.started_at,
                      )}
                    </div>
                  </div>

                  <div>
                    <div
                      className="
                        text-[clamp(10px,0.72vw,12px)]
                        uppercase
                        tracking-[0.06em]
                        text-slate-500
                      "
                    >
                      Finished at
                    </div>

                    <div
                      className="
                        mt-[clamp(5px,0.6vw,8px)]
                        text-[clamp(12px,0.85vw,14px)]
                        text-slate-200
                      "
                    >
                      {formatFullDate(
                        selectedRun.finished_at,
                      )}
                    </div>
                  </div>

                  {selectedRun.error_message && (
                    <div
                      className="
                        rounded-[clamp(9px,0.8vw,13px)]
                        border
                        border-red-400/20
                        bg-red-500/10
                        p-[clamp(10px,1vw,16px)]
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-[clamp(5px,0.5vw,8px)]
                          text-[clamp(12px,0.85vw,14px)]
                          font-medium
                          text-red-300
                        "
                      >
                        <CircleAlert
                          className="
                            h-[clamp(14px,1.15vw,17px)]
                            w-[clamp(14px,1.15vw,17px)]
                            shrink-0
                          "
                        />
                        Error message
                      </div>

                      <p
                        className="
                          mt-[clamp(8px,0.8vw,12px)]
                          whitespace-pre-wrap
                          break-words
                          text-[clamp(12px,0.85vw,14px)]
                          leading-relaxed
                          text-red-200/80
                        "
                      >
                        {
                          selectedRun.error_message
                        }
                      </p>
                    </div>
                  )}

                  {!selectedRun.error_message && (
                    <div
                      className="
                        rounded-[clamp(9px,0.8vw,13px)]
                        border
                        border-emerald-400/15
                        bg-emerald-500/5
                        p-[clamp(10px,1vw,16px)]
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-[clamp(5px,0.5vw,8px)]
                          text-[clamp(12px,0.85vw,14px)]
                          text-emerald-300
                        "
                      >
                        <Activity
                          className="
                            h-[clamp(14px,1.15vw,17px)]
                            w-[clamp(14px,1.15vw,17px)]
                            shrink-0
                          "
                        />

                        Run completed without a
                        recorded error.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="
                mt-[clamp(10px,1vw,16px)]
                flex
                shrink-0
                flex-wrap
                items-center
                justify-between
                gap-[clamp(8px,0.8vw,12px)]
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  gap-[clamp(5px,0.5vw,8px)]
                "
              >
                <ActionButton
                  icon={Copy}
                  disabled={
                    !selectedRun.final_report
                  }
                  onClick={handleCopy}
                >
                  Copy
                </ActionButton>

                <ActionButton
                  icon={Download}
                  disabled={
                    !selectedRun.final_report
                  }
                  onClick={handleExport}
                >
                  Export
                </ActionButton>
              </div>

              <ActionButton
                icon={Play}
                onClick={handleModifyRun}
                primary
              >
                Modify & Run
              </ActionButton>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}