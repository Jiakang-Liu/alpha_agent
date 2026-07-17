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
      normalizedAgentKey ===
      normalizedActiveNode
    ) {
      return "failed";
    }

    return "waiting";
  }

  if (
    runStatus === "running" &&
    normalizedAgentKey ===
      normalizedActiveNode
  ) {
    return "active";
  }

  return "waiting";
}

function getNodeLabel(node) {
  const normalizedNode =
    normalizeNodeName(node);

  const agent = AGENTS.find(
    (item) =>
      item.key === normalizedNode,
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

function normalizeLog(
  log,
  index,
  runStatus,
) {
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
      <div className="flex w-24 shrink-0 flex-col items-center text-center">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
            config.circle,
          ].join(" ")}
        >
          {state === "completed" ? (
            <Check
              size={18}
              strokeWidth={2.5}
            />
          ) : state === "active" ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : state === "failed" ? (
            <CircleAlert size={18} />
          ) : (
            <AgentIcon size={17} />
          )}
        </div>

        <div
          className={[
            "mt-2 max-w-full truncate text-sm font-medium",
            config.label,
          ].join(" ")}
        >
          {agent.label}
        </div>

        <div
          className={[
            "mt-0.5 max-w-full truncate text-xs",
            config.description,
          ].join(" ")}
        >
          {config.statusText}
        </div>
      </div>

      {!isLast && (
        <div className="mt-5 flex min-w-6 flex-1 items-center px-2">
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
        size={16}
        className="text-rose-400"
      />
    );
  }

  if (
    status === "active" ||
    status === "running"
  ) {
    return (
      <LoaderCircle
        size={16}
        className="animate-spin text-cyan-400"
      />
    );
  }

  return (
    <Check
      size={16}
      className="text-emerald-400"
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
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1627]/90 p-4 2xl:p-5">
      <div className="flex min-w-0 shrink-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium uppercase tracking-wide text-violet-300">
            Execution Trace
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            Real-time progress and pipeline events
          </p>
        </div>

        {onClear &&
          normalizedLogs.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">
                Clear
              </span>
            </button>
          )}
      </div>

      <div className="mt-4 min-w-0 shrink-0 overflow-x-auto overflow-y-hidden pb-1">
        <div className="flex min-w-[520px] items-start">
          {AGENTS.map(
            (agent, index) => (
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
            ),
          )}
        </div>
      </div>

      <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#08111f]">
        <div className="min-w-0 shrink-0 overflow-x-auto border-b border-slate-800">
          <div className="grid min-w-[620px] grid-cols-[90px_130px_minmax(240px,1fr)_32px] gap-3 px-4 py-3 text-xs font-medium text-slate-500">
            <div>Time</div>
            <div>Agent</div>
            <div>Message</div>
            <div />
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          {normalizedLogs.length === 0 ? (
            <div className="flex h-full min-h-[140px] items-center justify-center px-5 text-center">
              <div>
                <Circle
                  size={24}
                  className="mx-auto text-slate-700"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Waiting for pipeline events...
                </p>
              </div>
            </div>
          ) : (
            <div className="min-w-[620px]">
              {normalizedLogs.map(
                (log) => (
                  <div
                    key={log.id}
                    className="grid min-h-12 grid-cols-[90px_130px_minmax(240px,1fr)_32px] items-center gap-3 border-b border-slate-800/70 px-4 last:border-b-0"
                  >
                    <div className="truncate font-mono text-xs text-slate-500">
                      {log.timestamp}
                    </div>

                    <div
                      className={[
                        "truncate text-xs font-semibold",
                        getNodeColor(
                          log.node,
                        ),
                      ].join(" ")}
                    >
                      {getNodeLabel(
                        log.node,
                      )}
                    </div>

                    <div
                      className="truncate font-mono text-xs text-slate-300"
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
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}