import { CalendarDays, Leaf, ShieldCheck, Users2 } from 'lucide-react';

import { ClockCard } from './ClockCard';
import { StatCard } from './StatCard';
import { WeatherCard } from './WeatherCard';

export function StatsGrid({ metrics = {}, weather = {}, clock = {} }) {
  return (
    <section className="stats-grid">
      <StatCard icon={CalendarDays} label="Upcoming Events" value={metrics.upcoming_events ?? 0} />
      <StatCard icon={Users2} label="Training Sessions" value={metrics.training_sessions ?? 0} />
      <StatCard icon={ShieldCheck} label="Safety Score" value={metrics.safety_score ?? '0%'} />
      <StatCard icon={Leaf} label="ESG Projects" value={metrics.esg_projects ?? 0} />
      <WeatherCard weather={weather} />
      <ClockCard clock={clock} />
    </section>
  );
}
