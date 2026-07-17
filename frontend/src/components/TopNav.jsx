export default function TopNav({ activePage, setActivePage }) {
  const navItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "history", label: "History" },
  ];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between rounded-2xl border border-white/10 bg-[#0b1628] px-6">
      <div>
        <div className="text-lg font-bold tracking-wide text-white">
          AlphaAgent
        </div>
        <div className="text-xs text-slate-400">
          AI Financial Research Workspace
        </div>
      </div>

      <nav className="flex items-center gap-2">
        {navItems.map((item) => {
          const isActive = activePage === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActivePage(item.key)}
              className={[
                "rounded-xl px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}