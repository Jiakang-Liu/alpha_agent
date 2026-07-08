import { useState } from "react";

export default function LatestRunSummary({
  ticker,
  query,
  activeNode,
  isStreaming,
  report,
}) {
  const [expanded, setExpanded] = useState(false);

  const hasReport = Boolean(report?.trim());
  const status = isStreaming ? "Running" : hasReport ? "Success" : "Idle";

  const statusClass =
    status === "Success"
      ? "border-green-500/30 bg-green-500/10 text-green-400"
      : status === "Running"
      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
      : "border-slate-700 bg-slate-800/60 text-slate-400";

  const rows = [
    ["Run ID", "--"],
    ["Ticker", ticker || "--"],
    ["Query", query || "--"],
    ["Status", status],
    ["Current Node", activeNode || "--"],
    ["Started At", "--"],
    ["Finished At", "--"],
    ["Duration", "--"],
    ["Nodes Processed", "-- / 4"],
  ];

  const visibleRows = expanded ? rows : rows.slice(0, 4);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0b1627]/90 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm uppercase tracking-wide text-slate-300">
          Latest Run Summary
        </p>

        <span className={`rounded-lg border px-3 py-1 text-xs ${statusClass}`}>
          {status}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        {visibleRows.map(([label, value]) => (
          <SummaryRow key={label} label={label} value={value} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-4 text-sm text-blue-400 transition hover:text-blue-300"
      >
        {expanded ? "Collapse ↑" : "View Details →"}
      </button>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="grid grid-cols-[78px_minmax(0,1fr)] gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="truncate text-slate-100">{value}</span>
    </div>
  );
}