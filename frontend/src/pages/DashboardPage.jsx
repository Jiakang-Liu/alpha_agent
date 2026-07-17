import { useState } from "react";

import Dashboard from "../components/Dashboard";
import ExecutionTrace from "../components/ExecutionTrace";
import SystemHealth from "../components/SystemHealth";
import ReportPreview from "../components/ReportPreview";
import ReportModal from "../components/ReportModal";

export default function DashboardPage({
  ticker,
  query,
  report,
  logs,
  activeNode,
  completedNodes,
  runStatus,
  isStreaming,
  backendStatus,
  healthData,
  setTicker,
  setQuery,
  onSubmit,
  onRetryBackend,
}) {
  const [isReportOpen, setIsReportOpen] =
    useState(false);

  async function handleCopyReport() {
    if (!report?.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(report);
    } catch (error) {
      console.error(
        "Failed to copy report:",
        error,
      );
    }
  }

  function handleExportReport() {
    if (!report?.trim()) {
      return;
    }

    const safeTicker =
      ticker?.trim() || "report";

    const generatedDate = new Date();

    const fileDate = generatedDate
      .toISOString()
      .slice(0, 10);

    const content = [
      `# Financial Analysis — ${safeTicker}`,
      "",
      `- Ticker: ${safeTicker}`,
      `- Generated: ${generatedDate.toLocaleString()}`,
      "",
      "---",
      "",
      report,
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/markdown;charset=utf-8",
    });

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download = `${safeTicker}_${fileDate}_report.md`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  const reportStatus =
    runStatus === "failed"
      ? "failed"
      : "success";

  return (
    <>
      <div
        className="
          grid
          h-full
          min-h-0
          min-w-0
          grid-cols-1
          gap-3
          overflow-y-auto
          overflow-x-hidden
          xl:grid-cols-[clamp(300px,22vw,350px)_minmax(0,1fr)]
          xl:gap-4
          xl:overflow-hidden
        "
      >
        {/* Left column */}
        <aside
          className="
            grid
            min-h-0
            min-w-0
            grid-rows-[auto_auto]
            gap-3
            xl:h-full
            xl:grid-rows-[auto_minmax(0,1fr)]
            xl:gap-4
          "
        >
          <div className="min-w-0">
            <Dashboard
              ticker={ticker}
              query={query}
              isStreaming={isStreaming}
              backendStatus={backendStatus}
              setTicker={setTicker}
              setQuery={setQuery}
              onSubmit={onSubmit}
              onRetryBackend={onRetryBackend}
            />
          </div>

          <div
            className="
              min-h-[260px]
              min-w-0
              overflow-hidden
              xl:min-h-0
            "
          >
            <SystemHealth
              backendStatus={backendStatus}
              healthData={healthData}
              onRefresh={onRetryBackend}
            />
          </div>
        </aside>

        {/* Right column */}
        <section
          className="
            grid
            min-h-0
            min-w-0
            grid-rows-[auto_auto]
            gap-3
            xl:h-full
            xl:grid-rows-[minmax(0,1.12fr)_minmax(0,0.88fr)]
            xl:gap-4
          "
        >
          <div
            className="
              min-h-[360px]
              min-w-0
              overflow-hidden
              xl:min-h-0
            "
          >
            <ExecutionTrace
              activeNode={activeNode}
              completedNodes={completedNodes}
              runStatus={runStatus}
              logs={logs}
              isStreaming={isStreaming}
            />
          </div>

          <div
            className="
              min-h-[360px]
              min-w-0
              overflow-hidden
              xl:min-h-0
            "
          >
            <ReportPreview
              report={report}
              ticker={ticker}
              runId="--"
              generatedAt="--"
              status={reportStatus}
              isStreaming={isStreaming}
              onOpen={() =>
                setIsReportOpen(true)
              }
              onCopy={handleCopyReport}
              onExport={handleExportReport}
            />
          </div>
        </section>
      </div>

      <ReportModal
        open={isReportOpen}
        onClose={() =>
          setIsReportOpen(false)
        }
        report={report}
        ticker={ticker}
        runId="--"
        generatedAt="--"
        onCopy={handleCopyReport}
        onExport={handleExportReport}
      />
    </>
  );
}