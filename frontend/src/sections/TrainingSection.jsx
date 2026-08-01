import { CalendarCheck, Clock3, GraduationCap, UserCheck } from 'lucide-react';

export const TRAINING_SCHEDULES = [
  {
    title: 'Fire & Emergency Drill Certification',
    date: '2026-08-06',
    time: '8:00 AM — 12:00 PM',
    room: 'Assembly Hall',
    required: true,
    seats: 'Seats filled',
    tone: 'red',
  },
  {
    title: 'Quality 7 QC Tools Workshop',
    date: '2026-08-08',
    time: '1:00 PM — 5:00 PM',
    room: 'Training Room 2',
    required: true,
    seats: '8 of 20',
    tone: 'amber',
  },
  {
    title: 'New Manager Fundamentals',
    date: '2026-08-12',
    time: '9:00 AM — 4:00 PM',
    room: 'Executive Conference',
    required: false,
    seats: '12 of 16',
    tone: 'blue',
  },
  {
    title: 'Lean Manufacturing Basics',
    date: '2026-08-14',
    time: '8:30 AM — 11:30 AM',
    room: 'Floor 3 — Production',
    required: false,
    seats: '24 of 30',
    tone: 'emerald',
  },
  {
    title: 'Power BI for Business Reports',
    date: '2026-08-19',
    time: '1:00 PM — 4:00 PM',
    room: 'IT Lab',
    required: false,
    seats: '6 of 24',
    tone: 'indigo',
  },
  {
    title: 'Ethics & Data Privacy Refresher',
    date: '2026-08-22',
    time: '10:00 AM — 12:30 PM',
    room: 'Hybrid (Teams Live)',
    required: true,
    seats: 'Mandatory',
    tone: 'cyan',
  },
];

const TRAINING_KPIS = [
  { label: 'Sessions', value: '6', meta: 'Scheduled this month' },
  { label: 'Open Seats', value: '132', meta: 'Across optional programs' },
  { label: 'Mandatory', value: '3', meta: 'Compliance-critical tracks' },
];

const TONE_DOT = {
  red: '#dc2626',
  amber: '#d97706',
  blue: '#2563eb',
  emerald: '#059669',
  indigo: '#4f46e5',
  cyan: '#0891b2',
};

export function TrainingSection({ title = 'Training Schedules' }) {
  return (
    <section className="section-page">
      <header className="section-page__header">
        <div className="section-page__title-row">
          <span className="section-page__icon section-page__icon--blue">
            <GraduationCap size={24} strokeWidth={2.4} />
          </span>
          <div>
            <p className="eyebrow">L&D · August Programs</p>
            <h2 className="section-page__title">{title}</h2>
          </div>
        </div>
        <div className="section-page__badge section-page__badge--blue">
          <CalendarCheck size={16} strokeWidth={2.4} />
          <span>6 sessions · 132 seats open</span>
        </div>
      </header>

      <p className="section-page__lead">
        Keep teams informed with a premium view of learning schedules, required certifications,
        session capacity, and room assignments.
      </p>

      <div className="section-overview">
        {TRAINING_KPIS.map((item) => (
          <div key={item.label} className="section-kpi">
            <p className="section-kpi__label">{item.label}</p>
            <p className="section-kpi__value">{item.value}</p>
            <p className="section-kpi__meta">{item.meta}</p>
          </div>
        ))}
      </div>

      <div className="section-panel">
        <div className="training-list">
        {TRAINING_SCHEDULES.map((session) => {
          const date = new Date(session.date);
          const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
          const day = date.getDate();

          return (
            <button key={session.title} type="button" className="training-row">
              <div className="training-row__date">
                <span className="training-row__month">{month}</span>
                <span className="training-row__day">{day}</span>
              </div>

              <div className="training-row__content">
                <div className="training-row__title-row">
                  <h3 className="training-row__title">{session.title}</h3>
                  {session.required ? (
                    <span className="training-row__required">Required</span>
                  ) : (
                    <span className="training-row__optional">Optional</span>
                  )}
                </div>
                <div className="training-row__meta">
                  <span>
                    <Clock3 size={14} strokeWidth={2.4} />
                    {session.time}
                  </span>
                  <span>
                    <UserCheck size={14} strokeWidth={2.4} />
                    {session.seats}
                  </span>
                </div>
                <span className="training-row__room">
                  <span
                    className="training-row__dot"
                    style={{ background: TONE_DOT[session.tone] }}
                  />
                  {session.room}
                </span>
              </div>
            </button>
          );
        })}
        </div>
      </div>
    </section>
  );
}
