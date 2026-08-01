import { Award, Medal, Star, Trophy } from 'lucide-react';

export const AWARDS = [
  {
    rank: 1,
    category: 'Employee of the Month',
    recipient: 'Maria Elena Santos',
    team: 'Customer Experience',
    note: '98% first-contact resolution for 4 consecutive weeks.',
    tone: 'gold',
  },
  {
    rank: 2,
    category: 'Safety Champion',
    recipient: 'Rolando Jimenez',
    team: 'Operations',
    note: 'Zero-incident tenure and leadership in emergency drills.',
    tone: 'silver',
  },
  {
    rank: 3,
    category: 'Innovation Spotlight',
    recipient: 'Chloe de la Cruz',
    team: 'Engineering',
    note: 'Automation saved 40+ hours per month of manual reporting.',
    tone: 'bronze',
  },
  {
    rank: 4,
    category: 'Culture Ambassador',
    recipient: 'Danilo Aquino',
    team: 'Human Resources',
    note: 'Led 18 engagement sessions & employee communities.',
    tone: 'star',
  },
  {
    rank: 5,
    category: 'ESG Advocate',
    recipient: 'Andrea Villanueva',
    team: 'Facilities',
    note: 'Cut office plastic use by 42% across all 3 buildings.',
    tone: 'emerald',
  },
  {
    rank: 6,
    category: 'Top Trainer',
    recipient: 'Joseph Abad',
    team: 'Quality Assurance',
    note: 'Certified 21 new analysts this quarter.',
    tone: 'blue',
  },
];

const TONE_BADGE = {
  gold: 'linear-gradient(135deg, #fde047, #f59e0b)',
  silver: 'linear-gradient(135deg, #e5e7eb, #9ca3af)',
  bronze: 'linear-gradient(135deg, #fcd6b7, #d97706)',
  star: 'linear-gradient(135deg, #ddd6fe, #8b5cf6)',
  emerald: 'linear-gradient(135deg, #a7f3d0, #059669)',
  blue: 'linear-gradient(135deg, #93c5fd, #1d4ed8)',
};

export function AwardsSection({ title = 'Awards & Recognitions' }) {
  return (
    <section className="section-page">
      <header className="section-page__header">
        <div className="section-page__title-row">
          <span className="section-page__icon section-page__icon--amber">
            <Trophy size={24} strokeWidth={2.4} />
          </span>
          <div>
            <p className="eyebrow">August 2026 · Quarterly Honors</p>
            <h2 className="section-page__title">{title}</h2>
          </div>
        </div>
        <div className="section-page__badge section-page__badge--amber">
          <Award size={16} strokeWidth={2.4} />
          <span>6 outstanding employees</span>
        </div>
      </header>

      <div className="award-grid">
        {AWARDS.map((award) => (
          <button key={award.rank} type="button" className="award-card">
            <div className="award-card__rank" style={{ background: TONE_BADGE[award.tone] }}>
              <Trophy size={18} strokeWidth={2.4} />
              <span>Top {award.rank}</span>
            </div>
            <div className="award-card__category">
              <Medal size={16} strokeWidth={2.4} />
              {award.category}
            </div>
            <h3 className="award-card__recipient">{award.recipient}</h3>
            <p className="award-card__team">{award.team}</p>
            <div className="award-card__note">
              <Star size={14} strokeWidth={2.4} />
              <span>{award.note}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
