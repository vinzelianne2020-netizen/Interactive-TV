export function StatCard({ icon: Icon, label, value, onClick }) {
  return (
    <button
      type="button"
      className="metric-card metric-card--interactive"
      onClick={() => onClick?.()}
    >
      <div className="metric-badge">
        <Icon size={20} strokeWidth={2.4} />
      </div>
      <div className="metric-copy">
        <p className="metric-label">{label}</p>
        <p className="metric-value">{value}</p>
      </div>
    </button>
  );
}
