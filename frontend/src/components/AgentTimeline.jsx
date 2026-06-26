import { CheckCircle, Loader2 } from "lucide-react";

const nodes = [
  { id: "supervisor", title: "Supervisor Node" },
  { id: "data_agent", title: "Data Agent" },
  { id: "analyst_agent", title: "Analyst Agent" },
  { id: "critic_agent", title: "Critic Node" },
];

export default function AgentTimeline({ activeNode, isStreaming }) {
  const activeIndex = nodes.findIndex((node) => node.id === activeNode);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-[clamp(8px,1.4vh,16px)] text-[clamp(12px,1vw,16px)] tracking-wide text-slate-300">
        AGENT COOPERATION TRAJECTORY
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col justify-between py-[clamp(4px,1vh,12px)]">
        <div className="absolute left-[clamp(18px,2.4vw,30px)] top-[clamp(24px,4vh,38px)] bottom-[clamp(24px,4vh,38px)] border-l-2 border-dashed border-slate-500" />

        {nodes.map((node, index) => {
          const isActive = node.id === activeNode;
          const isCompleted =
            isStreaming && activeIndex !== -1 && index < activeIndex;

          return (
            <div key={node.id} className="relative flex min-w-0 items-center gap-[clamp(10px,1.6vw,22px)]">
              <div
                className={[
                  "z-10 flex shrink-0 items-center justify-center rounded-full border-2 font-bold",
                  "h-[clamp(36px,6vh,56px)] w-[clamp(36px,6vh,56px)] text-[clamp(15px,2.2vh,22px)]",
                  isActive
                    ? "border-yellow-300 bg-yellow-300 text-black"
                    : isCompleted
                    ? "border-green-400 bg-green-500/30 text-green-300"
                    : "border-slate-500 bg-[#6b6b78] text-white",
                ].join(" ")}
              >
                {isActive ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle className="h-7 w-7" />
                ) : (
                  index + 1
                )}
              </div>

              <div
                className={[
                  "min-w-0 rounded-lg px-[clamp(8px,1.2vw,16px)] py-[clamp(4px,0.8vh,9px)]",
                  isActive ? "bg-yellow-300 text-black shadow-lg" : "text-white",
                ].join(" ")}
              >
                <div className="break-words text-[clamp(17px,2.4vh,26px)] font-semibold leading-tight">
                  {node.title}
                </div>

                <div className="text-[clamp(11px,1.5vh,15px)] opacity-80">
                  {isActive ? "Processing" : isCompleted ? "Completed" : "Idle"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}