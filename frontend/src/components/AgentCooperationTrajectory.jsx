const steps = [
  { key: "supervisor", label: "Supervisor" },
  { key: "data_agent", label: "Data Agent" },
  { key: "analyst", label: "Analyst" },
  { key: "critic", label: "Critic" },
];

export default function AgentCooperationTrajectory({
  activeNode,
  isStreaming,
}) {
  const activeIndex = steps.findIndex((step) => step.key === activeNode);

  return (
    <section className="shrink-0 rounded-2xl border border-white/10 bg-[#0b1628] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Agent Progress
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isStreaming
              ? `Running: ${steps[activeIndex]?.label ?? "Starting"}`
              : "Idle"}
          </p>
        </div>

        <span
          className={[
            "rounded-full border px-3 py-1 text-xs",
            isStreaming
              ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
              : "border-slate-600 bg-slate-800 text-slate-400",
          ].join(" ")}
        >
          {isStreaming ? "Running" : "Idle"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {steps.map((step, index) => {
          const isDone = activeIndex > index;
          const isActive = activeIndex === index && isStreaming;

          return (
            <div key={step.key} className="flex flex-1 items-center gap-3">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold",
                    isDone
                      ? "border-emerald-400 bg-emerald-400 text-slate-950"
                      : isActive
                      ? "border-cyan-400 bg-cyan-400 text-slate-950"
                      : "border-slate-600 bg-slate-900 text-slate-500",
                  ].join(" ")}
                >
                  {index + 1}
                </div>

                <div
                  className={[
                    "text-xs",
                    isActive
                      ? "text-cyan-300"
                      : isDone
                      ? "text-emerald-300"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {step.label}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={[
                    "h-px flex-1",
                    isDone ? "bg-emerald-400/60" : "bg-slate-700",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}