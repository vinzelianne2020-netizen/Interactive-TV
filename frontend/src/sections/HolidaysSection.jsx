import { CalendarCheck, CalendarDays, Sparkles } from 'lucide-react';

export const HOLIDAYS = [
  { date: '2026-08-26', title: 'National Heroes Day', type: 'Regular Holiday', color: '#2563eb' },
  { date: '2026-09-01', title: 'Knowles Anniversary Special', type: 'Company Holiday', color: '#7c3aed' },
  { date: '2026-11-01', title: "All Saints' Day", type: 'Special Non-Working', color: '#0891b2' },
  { date: '2026-11-30', title: 'Bonifacio Day', type: 'Regular Holiday', color: '#2563eb' },
  { date: '2026-12-25', title: 'Christmas Day', type: 'Regular Holiday', color: '#dc2626' },
  { date: '2026-12-30', title: 'Rizal Day', type: 'Regular Holiday', color: '#2563eb' },
  { date: '2026-12-31', title: 'Last Day of the Year', type: 'Company Holiday', color: '#7c3aed' },
  { date: '2027-01-01', title: 'New Year’s Day', type: 'Regular Holiday', color: '#059669' },
];

export function HolidaysSection({ title = 'Holidays Next Month' }) {
  return (
    <section className="section-page">
      <header className="section-page__header">
        <div className="section-page__title-row">
          <span className="section-page__icon section-page__icon--indigo">
            <CalendarDays size={24} strokeWidth={2.4} />
          </span>
          <div>
            <p className="eyebrow">August / September 2026</p>
            <h2 className="section-page__title">{title}</h2>
          </div>
        </div>
        <div className="section-page__badge">
          <Sparkles size={16} strokeWidth={2.4} />
          <span>{HOLIDAYS.length} holidays scheduled</span>
        </div>
      </header>

      <div className="holiday-grid">
        {HOLIDAYS.map((holiday) => {
          const date = new Date(holiday.date);
          const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
          const day = date.getDate();
          const weekday = date.toLocaleString('en-US', { weekday: 'short' });

          return (
            <button key={holiday.date} type="button" className="holiday-card">
              <div
                className="holiday-card__date"
                style={{
                  background: `linear-gradient(180deg, ${holiday.color}, ${holiday.color}dd)`,
                }}
              >
                <span className="holiday-card__month">{month}</span>
                <span className="holiday-card__day">{day}</span>
                <span className="holiday-card__weekday">{weekday}</span>
              </div>
              <div className="holiday-card__body">
                <h3 className="holiday-card__title">{holiday.title}</h3>
                <span className="holiday-card__pill">{holiday.type}</span>
                <span className="holiday-card__note">
                  <CalendarCheck size={14} strokeWidth={2.4} />
                  Payroll-credited / non-working
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
