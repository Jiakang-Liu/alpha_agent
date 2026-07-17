import {
  Bot,
  Check,
  Circle,
  CircleAlert,
  Database,
  LoaderCircle,
  Route,
  ShieldCheck,
  Trash2,
} from "lucide-react";

const AGENTS = [
  {
    key: "supervisor",
    label: "Supervisor",
    icon: Route,
  },
  {
    key: "data_agent",
    label: "Data Agent",
    icon: Database,
  },
  {
    key: "analyst_agent",
    label: "Analyst",
    icon: Bot,
  },
  {
    key: "critic",
    label: "Critic",
    icon: ShieldCheck,
  },
];

function normalizeNodeName(node) {
  const normalized = String(node || "")
    .trim()
    .toLowerCase();

  if (normalized === "analyst") {
    return "analyst_agent";
  }

  if (normalized === "dataagent") {
    return "data_agent";
  }

  return normalized;
}

function getAgentState({
  agentKey,
  activeNode,
  completedNodes,
  runStatus,
}) {
  const normalizedAgentKey =
    normalizeNodeName(agentKey);

  const normalizedActiveNode =
    normalizeNodeName(activeNode);

  const normalizedCompletedNodes =
    completedNodes.map(normalizeNodeName);

  if (
    normalizedCompletedNodes.includes(
      normalizedAgentKey,
    )
  ) {
    return "completed";
  }

  if (runStatus === "failed") {
    if (
      normalizedAgentKey === normalizedActiveNode
    ) {
      return "failed";
    }

    return "waiting";
  }

  if (
    runStatus === "running" &&
    normalizedAgentKey === normalizedActiveNode
  ) {
    return "active";
  }

  return "waiting";
}

function getNodeLabel(node) {
  const normalizedNode =
    normalizeNodeName(node);

  const agent = AGENTS.find(
    (item) => item.key === normalizedNode,
  );

  if (agent) {
    return agent.label.toUpperCase();
  }

  return String(node || "SYSTEM")
    .replaceAll("_", " ")
    .toUpperCase();
}

function getNodeColor(node) {
  const normalizedNode =
    normalizeNodeName(node);

  const colorMap = {
    supervisor: "text-violet-300",
    data_agent: "text-cyan-300",
    analyst_agent: "text-amber-300",
    critic: "text-emerald-300",
    system: "text-slate-400",
  };

  return (
    colorMap[normalizedNode] ||
    "text-slate-400"
  );
}

function normalizeLog(log, index, runStatus) {
  if (typeof log === "string") {
    return {
      id: `log-${index}`,
      timestamp: "--:--:--",
      node: "system",
      message: log,
      status: "completed",
    };
  }

  let normalizedStatus =
    log.status ||
    (log.type === "error"
      ? "failed"
      : "completed");

  if (
    runStatus !== "running" &&
    (normalizedStatus === "running" ||
      normalizedStatus === "active")
  ) {
    normalizedStatus =
      runStatus === "failed"
        ? "failed"
        : "completed";
  }

  return {
    id:
      log.id ||
      `${log.type || "event"}-${index}`,

    timestamp:
      log.timestamp ||
      log.time ||
      log.createdAt ||
      "--:--:--",

    node:
      log.node ||
      log.agent ||
      log.source ||
      "system",

    message:
      log.message ||
      log.content ||
      log.text ||
      "Pipeline event received.",

    status: normalizedStatus,
  };
}

function AgentStep({
  agent,
  state,
  isLast,
}) {
  const AgentIcon = agent.icon;

  const stateConfig = {
    completed: {
      circle:
        "border-emerald-400 bg-emerald-400/10 text-emerald-300",
      label: "text-white",
      description: "text-emerald-400",
      statusText: "Completed",
    },

    active: {
      circle:
        "border-cyan-400 bg-cyan-400/10 text-cyan-300",
      label: "text-white",
      description: "text-cyan-400",
      statusText: "In Progress",
    },

    waiting: {
      circle:
        "border-slate-600 bg-[#0b1627] text-slate-500",
      label: "text-slate-400",
      description: "text-slate-500",
      statusText: "Waiting",
    },

    failed: {
      circle:
        "border-rose-400 bg-rose-400/10 text-rose-300",
      label: "text-white",
      description: "text-rose-400",
      statusText: "Failed",
    },
  };

  const config =
    stateConfig[state] ||
    stateConfig.waiting;

  return (
    <div className="flex min-w-0 flex-1 items-start">
      <div
        className="
          flex
          w-[clamp(72px,8vw,110px)]
          shrink-0
          flex-col
          items-center
          text-center
        "
      >
        <div
          className={[
            "flex shrink-0 items-center justify-center rounded-full border-2",
            "h-[clamp(34px,3vw,42px)]",
            "w-[clamp(34px,3vw,42px)]",
            config.circle,
          ].join(" ")}
        >
          {state === "completed" ? (
            <Check
              className="h-[clamp(15px,1.3vw,18px)] w-[clamp(15px,1.3vw,18px)]"
              strokeWidth={2.5}
            />
          ) : state === "active" ? (
            <LoaderCircle
              className="
                h-[clamp(15px,1.3vw,18px)]
                w-[clamp(15px,1.3vw,18px)]
                animate-spin
              "
            />
          ) : state === "failed" ? (
            <CircleAlert className="h-[clamp(15px,1.3vw,18px)] w-[clamp(15px,1.3vw,18px)]" />
          ) : (
            <AgentIcon className="h-[clamp(14px,1.2vw,17px)] w-[clamp(14px,1.2vw,17px)]" />
          )}
        </div>

        <div
          className={[
            "mt-[clamp(5px,0.6vw,8px)]",
            "max-w-full truncate",
            "text-[clamp(11px,0.85vw,14px)]",
            "font-medium",
            config.label,
          ].join(" ")}
        >
          {agent.label}
        </div>

        <div
          className={[
            "mt-[clamp(1px,0.2vw,3px)]",
            "max-w-full truncate",
            "text-[clamp(9px,0.7vw,12px)]",
            config.description,
          ].join(" ")}
        >
          {config.statusText}
        </div>
      </div>

      {!isLast && (
        <div
          className="
            mt-[clamp(17px,1.5vw,21px)]
            flex
            min-w-[clamp(16px,2vw,40px)]
            flex-1
            items-center
            px-[clamp(3px,0.7vw,12px)]
          "
        >
          <div
            className={[
              "h-px w-full",
              state === "completed"
                ? "bg-emerald-400"
                : state === "active"
                  ? "bg-gradient-to-r from-cyan-400 to-slate-700"
                  : "bg-slate-700",
            ].join(" ")}
          />
        </div>
      )}
    </div>
  );
}

function LogStatus({ status }) {
  if (status === "failed") {
    return (
      <CircleAlert
        className="
          h-[clamp(14px,1.15vw,17px)]
          w-[clamp(14px,1.15vw,17px)]
          text-rose-400
        "
      />
    );
  }

  if (
    status === "active" ||
    status === "running"
  ) {
    return (
      <LoaderCircle
        className="
          h-[clamp(14px,1.15vw,17px)]
          w-[clamp(14px,1.15vw,17px)]
          animate-spin
          text-cyan-400
        "
      />
    );
  }

  return (
    <Check
      className="
        h-[clamp(14px,1.15vw,17px)]
        w-[clamp(14px,1.15vw,17px)]
        text-emerald-400
      "
    />
  );
}

export default function ExecutionTrace({
  activeNode,
  completedNodes = [],
  runStatus = "idle",
  logs = [],
  isStreaming,
  onClear,
}) {
  const normalizedLogs = logs.map(
    (log, index) =>
      normalizeLog(
        log,
        index,
        runStatus,
      ),
  );

  return (
    <section
      className="
        flex
        h-full
        min-h-0
        min-w-0
        flex-col
        overflow-hidden
        rounded-[clamp(12px,1vw,18px)]
        border
        border-slate-800
        bg-[#0b1627]/90
        p-[clamp(12px,1.25vw,20px)]
      "
    >
      <div
        className="
          flex
          min-w-0
          shrink-0
          items-start
          justify-between
          gap-[clamp(8px,1vw,16px)]
        "
      >
        <div className="min-w-0 flex-1">
          <p
            className="
              truncate
              text-[clamp(11px,0.85vw,14px)]
              font-medium
              uppercase
              tracking-[0.08em]
              text-violet-300
            "
          >
            Execution Trace
          </p>

          <p
            className="
              mt-[clamp(2px,0.3vw,4px)]
              truncate
              text-[clamp(10px,0.72vw,12px)]
              text-slate-500
            "
          >
            Real-time progress and pipeline events
          </p>
        </div>

        {onClear &&
          normalizedLogs.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="
                inline-flex
                shrink-0
                items-center
                gap-[clamp(4px,0.5vw,8px)]
                rounded-[clamp(7px,0.6vw,10px)]
                border
                border-slate-700
                px-[clamp(8px,0.8vw,12px)]
                py-[clamp(6px,0.6vw,8px)]
                text-[clamp(10px,0.72vw,12px)]
                text-slate-400
                transition
                hover:bg-white/5
                hover:text-white
              "
            >
              <Trash2
                className="
                  h-[clamp(12px,1vw,14px)]
                  w-[clamp(12px,1vw,14px)]
                "
              />

              <span className="hidden sm:inline">
                Clear
              </span>
            </button>
          )}
      </div>

      <div
        className="
          mt-[clamp(14px,1.5vw,24px)]
          min-w-0
          shrink-0
          overflow-x-auto
          overflow-y-hidden
          pb-1
        "
      >
        <div className="flex min-w-[520px] items-start">
          {AGENTS.map((agent, index) => (
            <AgentStep
              key={agent.key}
              agent={agent}
              state={getAgentState({
                agentKey: agent.key,
                activeNode,
                completedNodes,
                runStatus,
              })}
              isLast={
                index ===
                AGENTS.length - 1
              }
            />
          ))}
        </div>
      </div>

      <div
        className="
          mt-[clamp(14px,1.5vw,24px)]
          flex
          min-h-[clamp(180px,28vh,300px)]
          min-w-0
          flex-1
          flex-col
          overflow-hidden
          rounded-[clamp(10px,0.8vw,14px)]
          border
          border-slate-800
          bg-[#08111f]
        "
      >
        <div className="min-w-0 overflow-x-auto">
          <div
            className="
              grid
              min-w-[620px]
              grid-cols-[clamp(82px,8vw,110px)_clamp(110px,12vw,160px)_minmax(240px,1fr)_clamp(24px,2.5vw,36px)]
              gap-[clamp(8px,1vw,16px)]
              border-b
              border-slate-800
              px-[clamp(10px,1vw,16px)]
              py-[clamp(8px,0.8vw,12px)]
              text-[clamp(10px,0.72vw,12px)]
              font-medium
              text-slate-500
            "
          >
            <div>Time</div>
            <div>Agent</div>
            <div>Message</div>
            <div />
          </div>
        </div>

        <div
          className="
            min-h-0
            min-w-0
            flex-1
            overflow-auto
          "
        >
          {normalizedLogs.length === 0 ? (
            <div
              className="
                flex
                h-full
                min-h-[clamp(150px,22vh,240px)]
                items-center
                justify-center
                px-[clamp(12px,1.2vw,20px)]
                text-center
              "
            >
              <div>
                <Circle
                  className="
                    mx-auto
                    h-[clamp(20px,1.8vw,25px)]
                    w-[clamp(20px,1.8vw,25px)]
                    text-slate-700
                  "
                />

                <p
                  className="
                    mt-[clamp(7px,0.8vw,12px)]
                    text-[clamp(11px,0.85vw,14px)]
                    text-slate-500
                  "
                >
                  Waiting for pipeline events...
                </p>
              </div>
            </div>
          ) : (
            <div className="min-w-[620px]">
              {normalizedLogs.map((log) => (
                <div
                  key={log.id}
                  className="
                    grid
                    min-h-[clamp(44px,5.5vh,56px)]
                    grid-cols-[clamp(82px,8vw,110px)_clamp(110px,12vw,160px)_minmax(240px,1fr)_clamp(24px,2.5vw,36px)]
                    items-center
                    gap-[clamp(8px,1vw,16px)]
                    border-b
                    border-slate-800/70
                    px-[clamp(10px,1vw,16px)]
                    last:border-b-0
                  "
                >
                  <div
                    className="
                      truncate
                      font-mono
                      text-[clamp(10px,0.72vw,12px)]
                      text-slate-500
                    "
                  >
                    {log.timestamp}
                  </div>

                  <div
                    className={[
                      "truncate font-semibold",
                      "text-[clamp(10px,0.72vw,12px)]",
                      getNodeColor(log.node),
                    ].join(" ")}
                  >
                    {getNodeLabel(log.node)}
                  </div>

                  <div
                    className="
                      truncate
                      font-mono
                      text-[clamp(10px,0.72vw,12px)]
                      text-slate-300
                    "
                    title={log.message}
                  >
                    {log.message}
                  </div>

                  <div className="flex justify-center">
                    <LogStatus
                      status={log.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}