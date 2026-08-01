import { Coffee, Dumbbell, MapPin, Sofa, UtensilsCrossed, Wifi } from 'lucide-react';

export const AMENITIES = [
  {
    name: '3F Sky Cafeteria',
    category: 'Food & Dining',
    hours: '6:30 AM — 7:00 PM',
    note: 'New regional Filipino menu available.',
    tone: 'orange',
    icon: UtensilsCrossed,
  },
  {
    name: 'Break Rooms (F2/F4)',
    category: 'Relax / Lounge',
    hours: '24/7 Access',
    note: 'Kettle, microwave, cold brew station.',
    tone: 'coffee',
    icon: Coffee,
  },
  {
    name: 'Employee Fitness Gym',
    category: 'Wellness',
    hours: '5:30 AM — 10:00 PM',
    note: 'Booking required for group classes.',
    tone: 'lime',
    icon: Dumbbell,
  },
  {
    name: 'Quiet Zone & Nap Pods',
    category: 'Rest · Focus',
    hours: '9:00 AM — 6:00 PM',
    note: '4 pods · 30-min max sessions.',
    tone: 'violet',
    icon: Sofa,
  },
  {
    name: 'Hi-Speed Wi-Fi 6E',
    category: 'Connectivity',
    hours: 'Available building-wide',
    note: 'SSID: KNOWLES-EMPLOYEE',
    tone: 'cyan',
    icon: Wifi,
  },
  {
    name: 'Shuttle Van (Cebu)',
    category: 'Transport',
    hours: '6:30 AM / 6:15 PM trips',
    note: '3 pickup points — IT Park, Ayala, SM.',
    tone: 'indigo',
    icon: MapPin,
  },
];

const TONE_CARD = {
  orange: 'linear-gradient(135deg, #fed7aa, #fb923c)',
  coffee: 'linear-gradient(135deg, #fde68a, #a16207)',
  lime: 'linear-gradient(135deg, #bbf7d0, #16a34a)',
  violet: 'linear-gradient(135deg, #ddd6fe, #7c3aed)',
  cyan: 'linear-gradient(135deg, #a5f3fc, #0891b2)',
  indigo: 'linear-gradient(135deg, #c7d2fe, #4f46e5)',
};

export function AmenitiesSection({ title = 'Amenities' }) {
  return (
    <section className="section-page">
      <header className="section-page__header">
        <div className="section-page__title-row">
          <span className="section-page__icon section-page__icon--violet">
            <Sofa size={24} strokeWidth={2.4} />
          </span>
          <div>
            <p className="eyebrow">Facilities · Cebu HQ</p>
            <h2 className="section-page__title">{title}</h2>
          </div>
        </div>
        <div className="section-page__badge section-page__badge--violet">
          <MapPin size={16} strokeWidth={2.4} />
          <span>6 work/life perks available</span>
        </div>
      </header>

      <div className="amenity-grid">
        {AMENITIES.map((amenity) => {
          const Icon = amenity.icon;
          return (
            <button key={amenity.name} type="button" className="amenity-card">
              <div
                className="amenity-card__top"
                style={{ background: TONE_CARD[amenity.tone] }}
              >
                <Icon size={26} strokeWidth={2.4} />
              </div>
              <div className="amenity-card__body">
                <span className="amenity-card__category">{amenity.category}</span>
                <h3 className="amenity-card__title">{amenity.name}</h3>
                <span className="amenity-card__hours">
                  <MapPin size={14} strokeWidth={2.4} />
                  {amenity.hours}
                </span>
                <p className="amenity-card__note">{amenity.note}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
