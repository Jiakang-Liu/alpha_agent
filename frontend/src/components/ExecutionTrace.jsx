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

const LOG_ROW_HEIGHT = 54;
const VISIBLE_LOG_ROWS = 5;
const LOG_LIST_HEIGHT = LOG_ROW_HEIGHT * VISIBLE_LOG_ROWS;

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

  /*
   * 一旦整个运行已经结束，
   * 日志里不应该继续保留 running / active。
   */
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
      <div className="flex min-w-[90px] flex-col items-center text-center">
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-full border-2",
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
            "mt-2 text-sm font-medium",
            config.label,
          ].join(" ")}
        >
          {agent.label}
        </div>

        <div
          className={[
            "mt-0.5 text-xs",
            config.description,
          ].join(" ")}
        >
          {config.statusText}
        </div>
      </div>

      {!isLast && (
        <div className="mt-5 flex flex-1 items-center px-3">
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
        size={17}
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
        size={17}
        className="animate-spin text-cyan-400"
      />
    );
  }

  return (
    <Check
      size={17}
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
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800 bg-[#0b1627]/90 p-5">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-violet-300">
            Execution Trace
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Real-time progress and pipeline events
          </p>
        </div>

        {onClear &&
          normalizedLogs.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Trash2 size={14} />
              Clear
            </button>
          )}
      </div>

      <div className="mt-6 flex shrink-0 items-start">
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

      <div className="mt-6 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-[#08111f]">
        <div className="grid grid-cols-[100px_150px_minmax(0,1fr)_32px] gap-4 border-b border-slate-800 px-4 py-3 text-xs font-medium text-slate-500">
          <div>Time</div>
          <div>Agent</div>
          <div>Message</div>
          <div />
        </div>

        <div
          className="overflow-y-auto"
          style={{
            height: `${LOG_LIST_HEIGHT}px`,
          }}
        >
          {normalizedLogs.length === 0 ? (
            <div
              className="flex items-center justify-center px-5 text-center"
              style={{
                height: `${LOG_LIST_HEIGHT}px`,
              }}
            >
              <div>
                <Circle
                  size={25}
                  className="mx-auto text-slate-700"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Waiting for pipeline events...
                </p>
              </div>
            </div>
          ) : (
            normalizedLogs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[100px_150px_minmax(0,1fr)_32px] items-center gap-4 border-b border-slate-800/70 px-4 last:border-b-0"
                style={{
                  minHeight: `${LOG_ROW_HEIGHT}px`,
                }}
              >
                <div className="font-mono text-xs text-slate-500">
                  {log.timestamp}
                </div>

                <div
                  className={[
                    "truncate text-xs font-semibold",
                    getNodeColor(log.node),
                  ].join(" ")}
                >
                  {getNodeLabel(log.node)}
                </div>

                <div
                  className="truncate font-mono text-xs text-slate-300"
                  title={log.message}
                >
                  {log.message}
                </div>

                <LogStatus
                  status={log.status}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}