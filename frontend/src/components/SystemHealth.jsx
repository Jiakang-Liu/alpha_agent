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
    <div
      className="
        flex
        min-w-0
        items-center
        gap-[clamp(8px,0.8vw,12px)]
        rounded-[clamp(10px,0.8vw,14px)]
        border
        border-slate-800
        bg-[#08111f]
        px-[clamp(10px,1vw,16px)]
        py-[clamp(9px,0.8vw,12px)]
      "
    >
      <div
        className="
          flex
          h-[clamp(30px,2.5vw,36px)]
          w-[clamp(30px,2.5vw,36px)]
          shrink-0
          items-center
          justify-center
          rounded-[clamp(7px,0.6vw,10px)]
          bg-[#111d31]
          text-slate-400
        "
      >
        <ItemIcon
          size={18}
          className="h-[clamp(15px,1.2vw,18px)] w-[clamp(15px,1.2vw,18px)]"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center justify-between gap-[clamp(6px,0.7vw,12px)]">
          <span className="min-w-0 truncate text-[clamp(12px,0.85vw,14px)] font-medium text-slate-100">
            {name}
          </span>

          <span
            className={[
              "flex shrink-0 items-center",
              "gap-[clamp(4px,0.4vw,8px)]",
              "text-[clamp(10px,0.72vw,12px)]",
              "font-medium",
              style.labelClassName,
            ].join(" ")}
          >
            <span
              className={[
                "h-[clamp(5px,0.4vw,6px)]",
                "w-[clamp(5px,0.4vw,6px)]",
                "shrink-0 rounded-full",
                style.dotClassName,
              ].join(" ")}
            />

            <span className="max-w-[clamp(70px,7vw,110px)] truncate">
              {label}
            </span>
          </span>
        </div>

        {description && (
          <p className="mt-[clamp(2px,0.25vw,4px)] truncate text-[clamp(10px,0.72vw,12px)] text-slate-500">
            {description}
          </p>
        )}
      </div>

      <StatusIcon
        size={16}
        className={[
          "h-[clamp(14px,1.1vw,16px)]",
          "w-[clamp(14px,1.1vw,16px)]",
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
      <div className="flex min-w-0 shrink-0 items-start justify-between gap-[clamp(8px,1vw,16px)]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[clamp(11px,0.85vw,14px)] font-medium uppercase tracking-[0.08em] text-violet-300">
            System Health
          </p>

          <div className="mt-[clamp(5px,0.5vw,8px)] flex min-w-0 items-center gap-[clamp(5px,0.5vw,8px)]">
            {overallIsChecking ? (
              <LoaderCircle
                size={16}
                className="h-[clamp(14px,1.1vw,16px)] w-[clamp(14px,1.1vw,16px)] shrink-0 animate-spin text-cyan-400"
              />
            ) : overallIsHealthy ? (
              <Activity
                size={16}
                className="h-[clamp(14px,1.1vw,16px)] w-[clamp(14px,1.1vw,16px)] shrink-0 text-cyan-400"
              />
            ) : (
              <CircleAlert
                size={16}
                className="h-[clamp(14px,1.1vw,16px)] w-[clamp(14px,1.1vw,16px)] shrink-0 text-rose-400"
              />
            )}

            <span
              className={[
                "min-w-0 truncate",
                "text-[clamp(10px,0.72vw,12px)]",
                "font-medium",
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
          className="
            flex
            h-[clamp(30px,2.5vw,36px)]
            w-[clamp(30px,2.5vw,36px)]
            shrink-0
            items-center
            justify-center
            rounded-[clamp(7px,0.6vw,10px)]
            border
            border-slate-700
            text-slate-400
            transition
            hover:border-cyan-400/30
            hover:bg-cyan-400/5
            hover:text-cyan-300
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <RefreshCw
            size={16}
            className={[
              "h-[clamp(14px,1.1vw,16px)]",
              "w-[clamp(14px,1.1vw,16px)]",
              isChecking ? "animate-spin" : "",
            ].join(" ")}
          />
        </button>
      </div>

      <div
        className="
          mt-[clamp(12px,1.2vw,20px)]
          flex
          min-h-0
          flex-1
          flex-col
          gap-[clamp(8px,0.8vw,12px)]
          overflow-y-auto
          overflow-x-hidden
          pr-1
        "
      >
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

      <div
        className="
          mt-[clamp(10px,1vw,16px)]
          flex
          min-w-0
          shrink-0
          items-center
          justify-between
          gap-[clamp(8px,0.8vw,12px)]
          border-t
          border-slate-800
          pt-[clamp(9px,0.8vw,14px)]
        "
      >
        <span className="shrink-0 text-[clamp(10px,0.72vw,12px)] text-slate-500">
          Last checked
        </span>

        <span className="min-w-0 truncate text-right text-[clamp(10px,0.72vw,12px)] text-slate-400">
          {formatCheckedTime(healthData?.checked_at)}
        </span>
      </div>
    </section>
  );
}