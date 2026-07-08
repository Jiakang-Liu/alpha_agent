import { useEffect, useState } from "react";
import LatestRunSummary from "../components/LatestRunSummary";
import SystemHealth from "../components/SystemHealth";
import RunHistory from "../components/RunHistory";
import LogsPanel from "../components/LogsPanel";

export default function AnalyticsPage({
  ticker,
  query,
  activeNode,
  logs,
  report,
  isStreaming,
  runHistoryVersion,
}) {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  return (
    <main className="grid min-h-0 flex-1 grid-cols-[335px_minmax(520px,1fr)] gap-4">
        
        <section className="flex min-h-0 min-w-0 flex-col gap-4">
            <LatestRunSummary
            ticker={ticker}
            query={query}
            activeNode={activeNode}
            isStreaming={isStreaming}
            report={report}
            />

            <SystemHealth />
        </section>

        <section className="flex min-h-0 min-w-0 flex-col gap-4">
            
            <RunHistory refreshKey={runHistoryVersion} />

            <div className="min-h-[220px] flex-1">
            <LogsPanel logs={logs} />
            </div>
        </section>
    </main>
  );
}