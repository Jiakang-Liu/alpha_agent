import {
  Activity,
  CircleAlert,
  CircleCheck,
  Database,
  LoaderCircle,
  Network,
  RefreshCw,
  Server,
} from "lucide-react";

function formatCheckedTime(value) {
  if (!value) {
    return "Not checked yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normalizeStatus(status) {
  return String(status || "unknown").toLowerCase();
}

function getStatusStyle(status) {
  const normalizedStatus = normalizeStatus(status);

  if (
    normalizedStatus === "healthy" ||
    normalizedStatus === "ready" ||
    normalizedStatus === "initialized"
  ) {
    return {
      labelClassName: "text-emerald-300",
      dotClassName: "bg-emerald-400",
      icon: CircleCheck,
      iconClassName: "text-emerald-400",
    };
  }

  if (
    normalizedStatus === "checking" ||
    normalizedStatus === "starting" ||
    normalizedStatus === "waking"
  ) {
    return {
      labelClassName: "text-cyan-300",
      dotClassName: "bg-cyan-400",
      icon: LoaderCircle,
      iconClassName: "animate-spin text-cyan-400",
    };
  }

  return {
    labelClassName: "text-rose-300",
    dotClassName: "bg-rose-400",
    icon: CircleAlert,
    iconClassName: "text-rose-400",
  };
}

function HealthItem({
  icon: ItemIcon,
  name,
  status,
  label,
  description,
}) {
  const style = getStatusStyle(status);
  const StatusIcon = style.icon;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#08111f] px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#111d31] text-slate-400">
        <ItemIcon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-medium text-slate-100">
            {name}
          </span>

          <span
            className={[
              "flex shrink-0 items-center gap-2 text-xs font-medium",
              style.labelClassName,
            ].join(" ")}
          >
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                style.dotClassName,
              ].join(" ")}
            />

            {label}
          </span>
        </div>

        {description && (
          <p className="mt-1 truncate text-xs text-slate-500">
            {description}
          </p>
        )}
      </div>

      <StatusIcon
        size={16}
        className={[
          "shrink-0",
          style.iconClassName,
        ].join(" ")}
      />
    </div>
  );
}

export default function SystemHealth({
  backendStatus = "checking",
  healthData,
  onRefresh,
}) {
  const isChecking =
    backendStatus === "checking" ||
    backendStatus === "waking";

  const backendHealthStatus =
    healthData?.backend?.status || backendStatus;

  const databaseStatus =
    healthData?.database?.status ||
    (isChecking ? "checking" : "unavailable");

  const graphStatus =
    healthData?.graph?.status ||
    (isChecking ? "checking" : "unavailable");

  const overallStatus =
    healthData?.status ||
    (isChecking ? "checking" : "degraded");

  const overallIsHealthy =
    normalizeStatus(overallStatus) === "healthy";

  const overallIsChecking =
    normalizeStatus(overallStatus) === "checking";

  const healthItems = [
    {
      name: "Backend API",
      icon: Server,
      status: backendHealthStatus,
      label:
        healthData?.backend?.label ||
        (isChecking ? "Checking" : "Unavailable"),
      description: "FastAPI analysis service",
    },
    {
      name: "Database",
      icon: Database,
      status: databaseStatus,
      label:
        healthData?.database?.label ||
        (isChecking ? "Checking" : "Unavailable"),
      description: "PostgreSQL connection",
    },
    {
      name: "AlphaGraph",
      icon: Network,
      status: graphStatus,
      label:
        healthData?.graph?.label ||
        (isChecking ? "Checking" : "Unavailable"),
      description: "LangGraph workflow",
    },
  ];

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800 bg-[#0b1627]/90 p-5">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-violet-300">
            System Health
          </p>

          <div className="mt-2 flex items-center gap-2">
            {overallIsChecking ? (
              <LoaderCircle
                size={16}
                className="animate-spin text-cyan-400"
              />
            ) : overallIsHealthy ? (
              <Activity
                size={16}
                className="text-cyan-400"
              />
            ) : (
              <CircleAlert
                size={16}
                className="text-rose-400"
              />
            )}

            <span
              className={[
                "text-xs font-medium",
                overallIsChecking
                  ? "text-cyan-300"
                  : overallIsHealthy
                    ? "text-cyan-300"
                    : "text-rose-300",
              ].join(" ")}
            >
              {overallIsChecking
                ? "Checking services"
                : overallIsHealthy
                  ? "All core services operational"
                  : "Some services are unavailable"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isChecking}
          aria-label="Refresh system health"
          title="Refresh system health"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-cyan-400/30 hover:bg-cyan-400/5 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={isChecking ? "animate-spin" : ""}
          />
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {healthItems.map((item) => (
          <HealthItem
            key={item.name}
            icon={item.icon}
            name={item.name}
            status={item.status}
            label={item.label}
            description={item.description}
          />
        ))}
      </div>

      <div className="mt-auto flex shrink-0 items-center justify-between border-t border-slate-800 pt-4">
        <span className="text-xs text-slate-500">
          Last checked
        </span>

        <span className="text-xs text-slate-400">
          {formatCheckedTime(healthData?.checked_at)}
        </span>
      </div>
    </section>
  );
}