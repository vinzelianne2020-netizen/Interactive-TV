import { BadgeCheck, Gift, HandCoins, PiggyBank } from 'lucide-react';

export const BENEFITS = [
  {
    key: 'hmo_release',
    title: 'HMO Release',
    subtitle: 'New dependents added this month',
    amount: '12 Cards',
    status: 'Released',
    tone: 'emerald',
    icon: BadgeCheck,
  },
  {
    key: 'mid_bonus',
    title: 'Mid-Year Bonus',
    subtitle: 'Posted for June cycle',
    amount: '1.25x Base',
    status: 'Eligible',
    tone: 'indigo',
    icon: HandCoins,
  },
  {
    key: 'yearly_allowance',
    title: 'Yearly Allowance',
    subtitle: 'Educational / Medical / Clothing',
    amount: '₱ 45,000',
    status: 'Available',
    tone: 'blue',
    icon: PiggyBank,
  },
  {
    key: 'loyalty_grant',
    title: 'Loyalty Grant',
    subtitle: '5-year employee appreciation',
    amount: '₱ 25,000',
    status: 'Qualify in Oct',
    tone: 'amber',
    icon: Gift,
  },
  {
    key: 'team_allowance',
    title: 'Team Allowance',
    subtitle: 'Quarterly team events',
    amount: '₱ 8,000 / team',
    status: 'Q3 Open',
    tone: 'cyan',
    icon: Gift,
  },
  {
    key: 'transport_allowance',
    title: 'Transport Allowance',
    subtitle: 'Wage supplementary',
    amount: '₱ 2,500 / mo',
    status: 'Active',
    tone: 'rose',
    icon: HandCoins,
  },
];

const TONE_STYLES = {
  emerald: { bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#047857' },
  indigo: { bg: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', color: '#4338ca' },
  blue: { bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#1d4ed8' },
  amber: { bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#b45309' },
  cyan: { bg: 'linear-gradient(135deg, #cffafe, #a5f3fc)', color: '#0e7490' },
  rose: { bg: 'linear-gradient(135deg, #ffe4e6, #fecdd3)', color: '#be123c' },
};

export function BenefitsSection({ title = 'Benefit Releases' }) {
  return (
    <section className="section-page">
      <header className="section-page__header">
        <div className="section-page__title-row">
          <span className="section-page__icon section-page__icon--emerald">
            <HandCoins size={24} strokeWidth={2.4} />
          </span>
          <div>
            <p className="eyebrow">Payroll · People Ops</p>
            <h2 className="section-page__title">{title}</h2>
          </div>
        </div>
        <div className="section-page__badge section-page__badge--emerald">
          <Gift size={16} strokeWidth={2.4} />
          <span>6 active benefits this cycle</span>
        </div>
      </header>

      <div className="benefit-grid">
        {BENEFITS.map((benefit) => {
          const Icon = benefit.icon;
          const tone = TONE_STYLES[benefit.tone] ?? TONE_STYLES.blue;

          return (
            <button key={benefit.key} type="button" className="benefit-card">
              <div className="benefit-card__header">
                <div
                  className="benefit-card__icon"
                  style={{ background: tone.bg, color: tone.color }}
                >
                  <Icon size={22} strokeWidth={2.4} />
                </div>
                <span className="benefit-card__status" style={{ color: tone.color, background: tone.bg }}>
                  {benefit.status}
                </span>
              </div>
              <h3 className="benefit-card__title">{benefit.title}</h3>
              <p className="benefit-card__subtitle">{benefit.subtitle}</p>
              <div className="benefit-card__amount" style={{ color: tone.color }}>
                {benefit.amount}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
