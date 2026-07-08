import { RefreshCw } from "lucide-react";

const services = [
  "Database",
  "Embedding Service",
  "OpenAI API",
  "Vector Index",
];

export default function SystemHealth() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0b1627]/90 p-5">
      <p className="mb-5 text-sm uppercase tracking-wide text-violet-300">
        System Health
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-800">
        {services.map((service) => (
          <div
            key={service}
            className="flex items-center justify-between border-b border-slate-800 px-3 py-3 text-sm last:border-b-0"
          >
            <span className="text-slate-100">{service}</span>

            <span className="flex items-center gap-2 text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Healthy
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
        <span>Last Checked: --</span>
        <RefreshCw size={13} />
      </div>
    </div>
  );
}