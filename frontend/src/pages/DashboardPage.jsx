import Dashboard from "../components/Dashboard";
import ReportViewer from "../components/ReportViewer";
import AgentCooperationTrajectory from "../components/AgentCooperationTrajectory";

export default function DashboardPage({
  ticker,
  query,
  report,
  activeNode,
  isStreaming,
  setTicker,
  setQuery,
  onSubmit,
}) {
  return (
    <main className="grid min-h-0 flex-1 grid-cols-[360px_minmax(0,1fr)] gap-4">
      <section className="min-h-0 min-w-0">
        <Dashboard
          ticker={ticker}
          query={query}
          isStreaming={isStreaming}
          setTicker={setTicker}
          setQuery={setQuery}
          onSubmit={onSubmit}
        />
      </section>

      <section className="flex min-h-0 min-w-0 flex-col gap-4">
        <AgentCooperationTrajectory
          activeNode={activeNode}
          isStreaming={isStreaming}
        />

        <div className="min-h-0 flex-1">
          <ReportViewer
            report={report}
            isStreaming={isStreaming}
            ticker={ticker}
            runId="--"
            generatedAt="--"
          />
        </div>
      </section>
    </main>
  );
}