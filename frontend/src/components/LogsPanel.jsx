import { useEffect, useRef } from "react";

export default function LogsPanel({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [logs]);

  return (
    <div className="h-[clamp(170px,24vh,260px)] shrink-0 rounded-2xl bg-[#242133] p-[clamp(14px,1.5vw,22px)]">
      <h2 className="mb-3 text-[clamp(18px,1.6vw,24px)] text-white">
        LIVE PIPELINE LOGS
      </h2>

      <div className="h-[calc(100%-44px)] overflow-y-auto rounded-xl bg-black p-4 font-mono text-[clamp(12px,1vw,15px)] text-green-400">
        {logs.length === 0 ? (
          <div className="text-green-400/50">
            Waiting for pipeline logs...
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}