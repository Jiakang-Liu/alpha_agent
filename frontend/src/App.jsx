import { useEffect, useRef, useState } from "react";
import TopNav from "./components/TopNav";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { useSSEStream } from "./hooks/useSSEStream";

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const [ticker, setTicker] = useState("TSLA");
  const [query, setQuery] = useState(
    "Analyze 2026 Free Cash Flow (FCF) trend"
  );

  const { activeNode, logs, report, isStreaming, triggerAnalysis } =
    useSSEStream();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!ticker.trim() || isStreaming) return;

    triggerAnalysis(ticker, query);
  };

  const [runHistoryVersion, setRunHistoryVersion] = useState(0);
  const wasStreamingRef = useRef(false);

  useEffect(() => {
    if (isStreaming) {
      wasStreamingRef.current = true;
      return;
    }

    if (wasStreamingRef.current) {
      wasStreamingRef.current = false;
      setRunHistoryVersion((value) => value + 1);
    }
  }, [isStreaming]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#07111f] p-4 text-white">
      <div className="flex h-full min-h-0 flex-col gap-4">
        <TopNav activePage={activePage} setActivePage={setActivePage} />

        {activePage === "dashboard" ? (
          <DashboardPage
            ticker={ticker}
            query={query}
            report={report}
            activeNode={activeNode}
            isStreaming={isStreaming}
            setTicker={setTicker}
            setQuery={setQuery}
            onSubmit={handleSubmit}
          />
        ) : (
          <AnalyticsPage
            ticker={ticker}
            query={query}
            activeNode={activeNode}
            logs={logs}
            report={report}
            isStreaming={isStreaming}
            runHistoryVersion={runHistoryVersion}
          />
        )}
      </div>
    </div>
  );
}