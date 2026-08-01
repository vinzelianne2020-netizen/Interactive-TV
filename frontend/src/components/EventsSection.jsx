import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { EventCard } from './EventCard';

const EVENTS_PER_PAGE = 6;

export function EventsSection({
  events = [],
  rotationSeconds = 24,
  kioskMode = true,
  paused = false,
  onTogglePause,
  onViewAllClick,
  onEventClick,
}) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(events.length / EVENTS_PER_PAGE)), [events.length]);

  useEffect(() => {
    if (totalPages <= 1) {
      setCurrentPage(0);
      return undefined;
    }

    if (paused) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentPage((page) => (page + 1) % totalPages);
    }, Math.max(rotationSeconds, 10) * 1000);

    return () => window.clearInterval(timer);
  }, [rotationSeconds, totalPages, paused]);

  useEffect(() => {
    setCurrentPage(0);
  }, [events]);

  const visibleEvents = events.slice(
    currentPage * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE + EVENTS_PER_PAGE,
  );

  const handleNext = () => setCurrentPage((page) => (page + 1) % totalPages);
  const handlePrev = () => setCurrentPage((page) => (page - 1 + totalPages) % totalPages);

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

        <div className="events-heading-controls">
          {totalPages > 1 ? (
            <>
              <button
                type="button"
                className="events-page-control"
                aria-label="Previous event page"
                onClick={handlePrev}
              >
                <ChevronLeft size={18} strokeWidth={2.4} />
              </button>
              <div className="events-page-indicator" aria-label={`Page ${currentPage + 1} of ${totalPages}`}>
                {currentPage + 1}/{totalPages}
              </div>
              <button
                type="button"
                className="events-page-control"
                aria-label="Next event page"
                onClick={handleNext}
              >
                <ChevronRight size={18} strokeWidth={2.4} />
              </button>
              <button
                type="button"
                className="events-page-control"
                aria-label={paused ? 'Resume event rotation' : 'Pause event rotation'}
                onClick={() => onTogglePause?.()}
              >
                {paused ? <Play size={16} strokeWidth={2.4} /> : <Pause size={16} strokeWidth={2.4} />}
              </button>
            </>
          ) : null}
          <button
            type="button"
            className={`section-link ${kioskMode ? 'section-link--disabled section-link--clickable' : ''}`}
            onClick={() => onViewAllClick?.()}
          >
            View All Events
            <ArrowRight size={16} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="events-dots" role="tablist" aria-label="Event pages">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === currentPage}
              aria-label={`Go to event page ${index + 1}`}
              className={
                index === currentPage ? 'events-dot events-dot--active' : 'events-dot'
              }
              onClick={() => setCurrentPage(index)}
            />
          ))}
        </div>
      ) : null}

      <div className="events-grid">
        {visibleEvents.map((event) => (
          <EventCard key={event.id} event={event} onClick={() => onEventClick?.(event)} />
        ))}
      </div>
    </section>
  );
}
