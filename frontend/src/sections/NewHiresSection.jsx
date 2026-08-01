import { Briefcase, Building2, Sparkles, UserPlus } from 'lucide-react';

export const NEW_HIRES = [
  {
    name: 'Sophia Reyes',
    role: 'Product Engineer',
    team: 'Platform Team',
    started: '2026-07-28',
    avatarColor: 'linear-gradient(135deg, #60a5fa, #1d4ed8)',
    initials: 'SR',
  },
  {
    name: 'Miguel Angelo Cruz',
    role: 'Supply Chain Analyst',
    team: 'Operations',
    started: '2026-07-28',
    avatarColor: 'linear-gradient(135deg, #34d399, #059669)',
    initials: 'MC',
  },
  {
    name: 'Isabelle Miranda',
    role: 'Learning & Development Associate',
    team: 'Human Resources',
    started: '2026-07-29',
    avatarColor: 'linear-gradient(135deg, #f472b6, #db2777)',
    initials: 'IM',
  },
  {
    name: 'Karl Andrei Bautista',
    role: 'Quality Engineer',
    team: 'Cebu Manufacturing',
    started: '2026-07-29',
    avatarColor: 'linear-gradient(135deg, #fbbf24, #b45309)',
    initials: 'KB',
  },
  {
    name: 'Janine Patricia Lim',
    role: 'Financial Analyst',
    team: 'Corporate Finance',
    started: '2026-08-01',
    avatarColor: 'linear-gradient(135deg, #a78bfa, #6d28d9)',
    initials: 'JL',
  },
  {
    name: 'Ramon Ignacio',
    role: 'Systems Engineer',
    team: 'IT Ops',
    started: '2026-08-04',
    avatarColor: 'linear-gradient(135deg, #22d3ee, #0891b2)',
    initials: 'RI',
  },
];

const NEW_HIRE_KPIS = [
  { label: 'New Joiners', value: '6', meta: 'July / August intake' },
  { label: 'Teams Covered', value: '6', meta: 'Across operations and corporate' },
  { label: 'Onboarding', value: '92%', meta: 'Current completion rate' },
];

export function NewHiresSection({ title = 'New Hires' }) {
  return (
    <section className="section-page">
      <header className="section-page__header">
        <div className="section-page__title-row">
          <span className="section-page__icon section-page__icon--rose">
            <UserPlus size={24} strokeWidth={2.4} />
          </span>
          <div>
            <p className="eyebrow">Onboarding · Cebu HQ</p>
            <h2 className="section-page__title">{title}</h2>
          </div>
        </div>
        <div className="section-page__badge section-page__badge--rose">
          <Sparkles size={16} strokeWidth={2.4} />
          <span>6 new team members · Welcome!</span>
        </div>
      </header>

      <p className="section-page__lead">
        Welcome new colleagues with a clear, polished overview of who joined, where they are
        contributing, and how onboarding is progressing.
      </p>

      <div className="section-overview">
        {NEW_HIRE_KPIS.map((item) => (
          <div key={item.label} className="section-kpi">
            <p className="section-kpi__label">{item.label}</p>
            <p className="section-kpi__value">{item.value}</p>
            <p className="section-kpi__meta">{item.meta}</p>
          </div>
        ))}
      </div>

      <div className="section-panel">
        <div className="hire-grid">
        {NEW_HIRES.map((hire) => (
          <button key={hire.name} type="button" className="hire-card">
            <div
              className="hire-card__avatar"
              style={{ background: hire.avatarColor }}
            >
              {hire.initials}
            </div>
            <h3 className="hire-card__name">{hire.name}</h3>
            <div className="hire-card__role">
              <Briefcase size={14} strokeWidth={2.4} />
              {hire.role}
            </div>
            <div className="hire-card__team">
              <Building2 size={14} strokeWidth={2.4} />
              {hire.team}
            </div>
            <span className="hire-card__date">
              Started {new Date(hire.started).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </button>
        ))}
        </div>
      </div>
    </section>
  );
}
