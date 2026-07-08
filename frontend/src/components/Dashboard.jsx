import { Play } from "lucide-react";

export default function Dashboard({
  ticker,
  query,
  isStreaming,
  setTicker,
  setQuery,
  onSubmit,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0b1627]/90 p-5">
      <p className="mb-5 text-sm uppercase tracking-wide text-violet-300">
        Input & Control
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div>
          <label className="mb-2 block text-sm text-slate-200">
            Stock Ticker
          </label>

          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            disabled={isStreaming}
            className="w-full rounded-lg border border-slate-700 bg-[#08111f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 disabled:opacity-60"
            placeholder="TSLA"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-200">
            User Query
          </label>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isStreaming}
            className="h-24 w-full resize-none rounded-lg border border-slate-700 bg-[#08111f] px-4 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 disabled:opacity-60"
            placeholder="Analyze 2026 Free Cash Flow trend"
          />
        </div>

        <button
          type="submit"
          disabled={isStreaming || !ticker.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play size={16} fill="currentColor" />
          {isStreaming ? "ANALYSIS RUNNING..." : "START ANALYSIS"}
        </button>
      </form>
    </div>
  );
}