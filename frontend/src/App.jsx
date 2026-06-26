import { useState } from "react";
import Dashboard from "./components/Dashboard";
import LogsPanel from "./components/LogsPanel";
import ReportViewer from "./components/ReportViewer";
import { useSSEStream } from "./hooks/useSSEStream";

export default function App() {
  const [ticker, setTicker] = useState("TSLA");
  const [query, setQuery] = useState(
    "Analyze 2026 Free Cash Flow (FCF) trend"
  );

  const {
    activeNode,
    logs,
    report,
    isStreaming,
    triggerAnalysis,
  } = useSSEStream();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!ticker.trim() || isStreaming) return;

    triggerAnalysis(ticker, query);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#171421] p-4 text-white">
  <div className="grid h-full min-h-0 grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-4">
    <section className="flex min-w-0 flex-col gap-4 min-h-0">
      <Dashboard
        ticker={ticker}
        query={query}
        activeNode={activeNode}
        isStreaming={isStreaming}
        setTicker={setTicker}
        setQuery={setQuery}
        onSubmit={handleSubmit}
      />

      <LogsPanel logs={logs} />
    </section>

    <section className="min-w-0 min-h-0">
      <ReportViewer
        report={report}
        isStreaming={isStreaming}
      />
    </section>
  </div>
</div>
  );
}