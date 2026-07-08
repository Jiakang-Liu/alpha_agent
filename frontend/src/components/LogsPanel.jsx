import { useEffect, useRef } from "react";

function getLogType(log) {
  const upper = log.toUpperCase();

  if (upper.includes("SUPERVISOR")) return "SUPERVISOR";
  if (upper.includes("DATA")) return "DATA_AGENT";
  if (upper.includes("ANALYST")) return "ANALYST";
  if (upper.includes("CRITIC")) return "CRITIC";
  if (upper.includes("ERROR")) return "ERROR";

  return "SYSTEM";
}

function getTagColor(type) {
  switch (type) {
    case "SUPERVISOR":
      return "text-cyan-400";

    case "DATA_AGENT":
      return "text-green-400";

    case "ANALYST":
      return "text-violet-400";

    case "CRITIC":
      return "text-yellow-400";

    case "ERROR":
      return "text-red-400";

    default:
      return "text-sky-400";
  }
}

export default function LogsPanel({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [logs]);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800 bg-[#0b1627]/90 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-wide text-slate-300">
          Live Pipeline Logs
        </h2>

        <button className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-800">
          Clear
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-[#050b14] p-4 font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-slate-500">
            Waiting for pipeline logs...
          </div>
        ) : (
          logs.map((log, index) => {
            const type = getLogType(log);

            return (
              <div
                key={index}
                className="mb-2 flex gap-3 leading-relaxed"
              >
                <span className="w-[80px] shrink-0 text-slate-500">
                  [{String(index + 1).padStart(2, "0")}]
                </span>

                <span
                  className={`w-[110px] shrink-0 font-semibold ${getTagColor(
                    type
                  )}`}
                >
                  {type}
                </span>

                <span className="break-words text-slate-200">
                  {log}
                </span>
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}