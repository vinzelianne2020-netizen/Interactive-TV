import { Droplets, Leaf, Recycle, Trees, Wind } from 'lucide-react';

export const ESG_PROJECTS = [
  {
    title: 'Solar Rooftop Rollout',
    scope: 'Phases 1 — 3 (Cebu & Laguna)',
    impact: '- 21% grid energy use',
    progress: 62,
    tone: 'sun',
    icon: Leaf,
  },
  {
    title: 'Zero Single-Use Plastics',
    scope: 'Canteen, pantry, and packaging',
    impact: '- 42% plastic waste',
    progress: 78,
    tone: 'blue',
    icon: Droplets,
  },
  {
    title: 'Urban Tree Initiative',
    scope: 'Partner barangays — 3 sites',
    impact: '1,200 trees planted',
    progress: 48,
    tone: 'green',
    icon: Trees,
  },
  {
    title: 'Office Air Quality Upgrade',
    scope: 'HVAC & fresh air intake',
    impact: '99% PM2.5 filtered',
    progress: 100,
    tone: 'air',
    icon: Wind,
  },
  {
    title: 'E-Waste Recycling Drive',
    scope: 'Company & community drive',
    impact: '380 kg recycled',
    progress: 34,
    tone: 'violet',
    icon: Recycle,
  },
  {
    title: 'Community Scholarships',
    scope: 'Public high school STEM track',
    impact: '42 scholars active',
    progress: 80,
    tone: 'indigo',
    icon: Leaf,
  },
];

const ESG_KPIS = [
  { label: 'Active Projects', value: '6', meta: 'Across environmental and social tracks' },
  { label: 'Waste Reduction', value: '42%', meta: 'Single-use plastics improvement' },
  { label: 'Scholars', value: '42', meta: 'Community education impact' },
];

const TONE_GRADIENTS = {
  sun: 'linear-gradient(135deg, #fde68a, #f59e0b)',
  blue: 'linear-gradient(135deg, #bae6fd, #0284c7)',
  green: 'linear-gradient(135deg, #86efac, #15803d)',
  air: 'linear-gradient(135deg, #c4b5fd, #7c3aed)',
  violet: 'linear-gradient(135deg, #ddd6fe, #4f46e5)',
  indigo: 'linear-gradient(135deg, #bfdbfe, #4338ca)',
};

export function ESGSection({ title = 'ESG' }) {
  return (
    <section className="section-page">
      <header className="section-page__header">
        <div className="section-page__title-row">
          <span className="section-page__icon section-page__icon--leaf">
            <Leaf size={24} strokeWidth={2.4} />
          </span>
          <div>
            <p className="eyebrow">Environment · Social · Governance</p>
            <h2 className="section-page__title">{title}</h2>
          </div>
        </div>
        <div className="section-page__badge section-page__badge--leaf">
          <Recycle size={16} strokeWidth={2.4} />
          <span>6 active initiatives</span>
        </div>
      </header>

      <p className="section-page__lead">
        Present sustainability, governance, and community impact in a premium dashboard that is
        easy to scan and strong enough for executive storytelling.
      </p>

      <div className="section-overview">
        {ESG_KPIS.map((item) => (
          <div key={item.label} className="section-kpi">
            <p className="section-kpi__label">{item.label}</p>
            <p className="section-kpi__value">{item.value}</p>
            <p className="section-kpi__meta">{item.meta}</p>
          </div>
        ))}
      </div>

      <div className="section-panel">
        <div className="esg-grid">
        {ESG_PROJECTS.map((project) => {
          const Icon = project.icon;
          return (
            <button key={project.title} type="button" className="esg-card">
              <div
                className="esg-card__icon"
                style={{ background: TONE_GRADIENTS[project.tone] }}
              >
                <Icon size={22} strokeWidth={2.4} />
              </div>
              <h3 className="esg-card__title">{project.title}</h3>
              <p className="esg-card__scope">{project.scope}</p>
              <p className="esg-card__impact">{project.impact}</p>
              <div className="esg-card__progress" aria-label={`${project.progress}%`}>
                <div
                  className="esg-card__progress-fill"
                  style={{ width: `${project.progress}%`, background: TONE_GRADIENTS[project.tone] }}
                />
                <span className="esg-card__progress-label">{project.progress}%</span>
              </div>
            </button>
          );
        })}
        </div>
      </div>
    </section>
  );
}
