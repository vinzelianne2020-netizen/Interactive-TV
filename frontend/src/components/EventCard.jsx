import { Clock3, MapPin } from 'lucide-react';

export function EventCard({ event }) {
  if (!event) {
    return null;
  }

  return (
    <article className="event-card">
      <div className="event-card__media">
        <img className="event-card__image" src={event.image_url} alt={event.title} />
        <div className="event-card__date-badge">
          <span className="event-card__month">{event.month}</span>
          <span className="event-card__day">{event.day}</span>
          <span className="event-card__weekday">{event.weekday}</span>
        </div>
      </div>
      <div className="event-card__body">
        <div className="event-card__meta-row">
          <span className="event-card__meta">
            <Clock3 size={14} strokeWidth={2.4} />
            {event.time}
          </span>
          <span className="event-card__meta">
            <MapPin size={14} strokeWidth={2.4} />
            {event.location}
          </span>
        </div>
        <h3 className="event-card__title">{event.title}</h3>
        <p className="event-card__description">{event.description}</p>
      </div>
    </article>
  );
}
