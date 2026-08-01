import { CalendarDays, Leaf, ShieldCheck, Users2 } from 'lucide-react';

import { ClockCard } from './ClockCard';
import { StatCard } from './StatCard';
import { WeatherCard } from './WeatherCard';

export function StatsGrid({ metrics = {}, weather = {}, clock = {}, onStatClick }) {
  return (
    <section className="stats-grid">
      <StatCard
        icon={CalendarDays}
        label="Upcoming Events"
        value={metrics.upcoming_events ?? 0}
        onClick={() => onStatClick?.('upcoming_events')}
      />
      <StatCard
        icon={Users2}
        label="Training Sessions"
        value={metrics.training_sessions ?? 0}
        onClick={() => onStatClick?.('training_sessions')}
      />
      <StatCard
        icon={ShieldCheck}
        label="Safety Score"
        value={metrics.safety_score ?? '0%'}
        onClick={() => onStatClick?.('safety_score')}
      />
      <StatCard
        icon={Leaf}
        label="ESG Projects"
        value={metrics.esg_projects ?? 0}
        onClick={() => onStatClick?.('esg_projects')}
      />
      <WeatherCard weather={weather} onClick={() => onStatClick?.('weather')} />
      <ClockCard clock={clock} onClick={() => onStatClick?.('clock')} />
    </section>
  );
}
