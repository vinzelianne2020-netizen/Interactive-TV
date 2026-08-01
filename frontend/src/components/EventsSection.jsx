import { ArrowRight, CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { EventCard } from './EventCard';

const EVENTS_PER_PAGE = 6;

export function EventsSection({ events = [], rotationSeconds = 24, kioskMode = true }) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(events.length / EVENTS_PER_PAGE)), [events.length]);

  useEffect(() => {
    if (totalPages <= 1) {
      setCurrentPage(0);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentPage((page) => (page + 1) % totalPages);
    }, Math.max(rotationSeconds, 10) * 1000);

    return () => window.clearInterval(timer);
  }, [rotationSeconds, totalPages]);

  useEffect(() => {
    setCurrentPage(0);
  }, [events]);

  const visibleEvents = events.slice(currentPage * EVENTS_PER_PAGE, currentPage * EVENTS_PER_PAGE + EVENTS_PER_PAGE);

  return (
    <section className="events-section">
      <div className="section-heading">
        <div className="section-heading__title">
          <span className="section-heading__icon">
            <CalendarDays size={20} strokeWidth={2.4} />
          </span>
          <div>
            <p className="eyebrow">Schedule</p>
            <h2>Upcoming Events</h2>
          </div>
        </div>
        {kioskMode ? (
          <span className="section-link section-link--disabled">
            View All Events
            <ArrowRight size={16} strokeWidth={2.4} />
          </span>
        ) : (
          <a className="section-link" href="/admin">
            View All Events
            <ArrowRight size={16} strokeWidth={2.4} />
          </a>
        )}
      </div>

      <div className="events-grid">
        {visibleEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
