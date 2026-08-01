import { AlertTriangle, CheckCircle2, Flame, ShieldCheck } from 'lucide-react';

export const SAFETY_STATS = [
  { label: 'Days without LTI', value: '342', tone: 'emerald' },
  { label: 'Near Miss Reports', value: '18', tone: 'amber' },
  { label: 'Fire Drills Completed', value: '6 / 8', tone: 'blue' },
  { label: 'Safety Score', value: '98.4%', tone: 'indigo' },
];

export const SAFETY_ALERTS = [
  {
    title: 'Annual Fire Drill — Week of Aug 5',
    level: 'Mandatory',
    note: 'Assembly at 8:00 AM at the back parking lot.',
    tone: 'red',
  },
  {
    title: 'Personal Protective Equipment (PPE) Campaign',
    level: 'Active',
    note: 'Visit the EHS booth on 2F for your new safety eyewear.',
    tone: 'amber',
  },
  {
    title: 'Housekeeping Audit Winner',
    level: 'Success',
    note: 'Production Line B retained 5S GOLD for August.',
    tone: 'emerald',
  },
];

const SAFETY_KPIS = [
  { label: 'LTI-Free Days', value: '342', meta: 'Current streak' },
  { label: 'Audit Readiness', value: '95%', meta: 'Environment, health & safety' },
  { label: 'Campaign Focus', value: 'PPE', meta: 'August priority program' },
];

const TONE_BOX = {
  emerald: { bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#047857' },
  amber: { bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#b45309' },
  blue: { bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#1d4ed8' },
  indigo: { bg: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', color: '#4338ca' },
  red: { bg: 'linear-gradient(135deg, #fee2e2, #fecaca)', color: '#b91c1c' },
};

export function SafetySection({ title = 'Safety' }) {
  return (
    <section className="section-page">
      <header className="section-page__header">
        <div className="section-page__title-row">
          <span className="section-page__icon section-page__icon--green">
            <ShieldCheck size={24} strokeWidth={2.4} />
          </span>
          <div>
            <p className="eyebrow">EHS · August Campaign</p>
            <h2 className="section-page__title">{title}</h2>
          </div>
        </div>
        <div className="section-page__badge section-page__badge--green">
          <Flame size={16} strokeWidth={2.4} />
          <span>All clear · Zero LTI this week</span>
        </div>
      </header>

      <p className="section-page__lead">
        Surface safety performance, live campaign priorities, and critical reminders in a clean
        executive-style view for the whole workplace.
      </p>

      <div className="section-overview">
        {SAFETY_KPIS.map((item) => (
          <div key={item.label} className="section-kpi">
            <p className="section-kpi__label">{item.label}</p>
            <p className="section-kpi__value">{item.value}</p>
            <p className="section-kpi__meta">{item.meta}</p>
          </div>
        ))}
      </div>

      <div className="section-panel">
      <div className="safety-grid">
        {SAFETY_STATS.map((stat) => {
          const tone = TONE_BOX[stat.tone] ?? TONE_BOX.blue;
          return (
            <div key={stat.label} className="safety-stat" style={{ background: tone.bg, color: tone.color }}>
              <ShieldCheck size={22} strokeWidth={2.4} />
              <div>
                <p className="safety-stat__value">{stat.value}</p>
                <p className="safety-stat__label">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="safety-list">
        {SAFETY_ALERTS.map((alert, index) => {
          const tone = TONE_BOX[alert.tone];
          const Icon =
            alert.tone === 'red'
              ? AlertTriangle
              : alert.tone === 'emerald'
              ? CheckCircle2
              : AlertTriangle;

          return (
            <button
              key={index}
              type="button"
              className="safety-alert"
              style={{ background: tone.bg, color: tone.color }}
            >
              <span className="safety-alert__icon">
                <Icon size={22} strokeWidth={2.4} />
              </span>
              <div>
                <div className="safety-alert__row">
                  <h3 className="safety-alert__title">{alert.title}</h3>
                  <span className="safety-alert__level">{alert.level}</span>
                </div>
                <p className="safety-alert__note">{alert.note}</p>
              </div>
            </button>
          );
        })}
      </div>
      </div>
    </section>
  );
}
