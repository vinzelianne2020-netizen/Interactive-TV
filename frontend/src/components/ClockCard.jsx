import { Clock3 } from 'lucide-react';

export function ClockCard({ clock = {}, onClick }) {
  return (
    <button
      type="button"
      className="metric-card metric-card--clock metric-card--interactive"
      onClick={() => onClick?.()}
    >
      <div className="metric-badge metric-badge--clock">
        <Clock3 size={22} strokeWidth={2.4} />
      </div>
      <div className="clock-copy">
        <p className="metric-value metric-value--clock">{clock.time ?? '--:--:-- --'}</p>
        <p className="metric-label">{clock.weekday ?? 'Today'}</p>
        <p className="clock-date">{clock.date ?? 'Loading date...'}</p>
      </div>
    </button>
  );
}
