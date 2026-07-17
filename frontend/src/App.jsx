import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import TopNav from "./components/TopNav";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import { useSSEStream } from "./hooks/useSSEStream";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

export default function App() {
  const [activePage, setActivePage] =
    useState("dashboard");

  const [ticker, setTicker] = useState("TSLA");

  const [query, setQuery] = useState(
    "Analyze 2026 Free Cash Flow (FCF) trend",
  );

  const [backendStatus, setBackendStatus] =
    useState("checking");

  const [healthData, setHealthData] =
    useState(null);

  const [
    runHistoryVersion,
    setRunHistoryVersion,
  ] = useState(0);

  const wasStreamingRef = useRef(false);

  const {
    activeNode,
    completedNodes,
    runStatus,
    logs,
    report,
    isStreaming,
    triggerAnalysis,
  } = useSSEStream();

  const checkBackendHealth =
    useCallback(async () => {
      setBackendStatus("checking");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/health`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          },
        );

        let data = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        console.log(
          "[HEALTH] response:",
          response.status,
          data,
        );

        if (
          response.ok &&
          data?.status === "healthy" &&
          data?.backend?.status === "ready"
        ) {
          setHealthData(data);
          setBackendStatus("ready");
          return;
        }

        setHealthData(data);
        setBackendStatus("unavailable");
      } catch (error) {
        console.error(
          "[HEALTH] request failed:",
          error,
        );

        setHealthData(null);
        setBackendStatus("unavailable");
      }
    }, []);

  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  useEffect(() => {
    if (isStreaming) {
      wasStreamingRef.current = true;
      return;
    }

    if (!wasStreamingRef.current) {
      return;
    }

    wasStreamingRef.current = false;

    setRunHistoryVersion(
      (currentVersion) =>
        currentVersion + 1,
    );

    checkBackendHealth();
  }, [
    isStreaming,
    checkBackendHealth,
  ]);

  useEffect(() => {
    console.log(
      "[FRONTEND] backendStatus:",
      backendStatus,
    );
  }, [backendStatus]);

  function handleSubmit(event) {
    event.preventDefault();

    const normalizedTicker =
      ticker.trim();

    const normalizedQuery =
      query.trim();

    if (
      !normalizedTicker ||
      !normalizedQuery ||
      isStreaming ||
      backendStatus !== "ready"
    ) {
      return;
    }

    triggerAnalysis(
      normalizedTicker,
      normalizedQuery,
    );
  }

  function handleModifyRun({
    ticker: selectedTicker,
    userQuery,
  }) {
    setTicker(selectedTicker || "");
    setQuery(userQuery || "");
    setActivePage("dashboard");
  }

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#07111f] text-white">
      <div className="flex h-full min-h-0 min-w-0 flex-col gap-2 p-2 sm:gap-3 sm:p-3 xl:gap-4 xl:p-4">
        <header className="min-w-0 shrink-0">
          <TopNav
            activePage={activePage}
            setActivePage={setActivePage}
          />
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {activePage ===
            "dashboard" && (
            <div className="h-full min-h-0 min-w-0 overflow-hidden">
              <DashboardPage
                ticker={ticker}
                query={query}
                report={report}
                logs={logs}
                activeNode={activeNode}
                completedNodes={
                  completedNodes
                }
                runStatus={runStatus}
                isStreaming={isStreaming}
                backendStatus={
                  backendStatus
                }
                healthData={healthData}
                setTicker={setTicker}
                setQuery={setQuery}
                onSubmit={handleSubmit}
                onRetryBackend={
                  checkBackendHealth
                }
              />
            </div>
          )}

          {activePage === "history" && (
            <div className="h-full min-h-0 min-w-0 overflow-hidden">
              <HistoryPage
                key={runHistoryVersion}
                onModifyRun={
                  handleModifyRun
                }
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}