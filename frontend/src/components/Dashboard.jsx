import AgentTimeline from "./AgentTimeline";

export default function Dashboard({
  ticker,
  query,
  activeNode,
  isStreaming,
  setTicker,
  setQuery,
  onSubmit,
}) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-[#242133] p-[clamp(16px,1.6vw,26px)]">
      <div className="grid h-full min-h-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-[clamp(14px,1.6vw,28px)]">
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="text-[clamp(12px,0.9vw,15px)] text-slate-400">
            CONTROL & TRACKING
          </div>

          <h1 className="mt-2 text-[clamp(26px,2.6vw,42px)] font-bold leading-tight text-white">
            AlphaAgent Dashboard
          </h1>

          <form
            onSubmit={onSubmit}
            className="mt-[clamp(14px,2vh,24px)] flex min-h-0 flex-col gap-[clamp(10px,1.5vh,18px)]"
          >
            <div>
              <label className="text-[clamp(14px,1.1vw,19px)] text-slate-200">
                Stock Ticker:
              </label>

              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                disabled={isStreaming}
                className="mt-2 w-full rounded-lg bg-white px-4 py-[clamp(8px,1.2vh,14px)] text-black outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-[clamp(14px,1.1vw,19px)] text-slate-200">
                User Query:
              </label>

              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isStreaming}
                className="mt-2 h-[clamp(72px,13vh,118px)] w-full resize-none rounded-lg bg-white px-4 py-3 text-black outline-none disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isStreaming || !ticker.trim()}
              className="w-full rounded-lg bg-violet-600 py-[clamp(9px,1.4vh,14px)] font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              {isStreaming
                ? "DEPTH AUDIT IN PROGRESS..."
                : "START ANALYSIS"}
            </button>
          </form>
        </div>

        <div className="min-h-0 min-w-0 overflow-hidden">
          <AgentTimeline
            activeNode={activeNode}
            isStreaming={isStreaming}
          />
        </div>
      </div>
    </div>
  );
}