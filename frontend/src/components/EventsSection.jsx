import { ArrowRight, CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { EventCard } from './EventCard';

const EVENTS_PER_PAGE = 10;

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
  const [currentSlide, setCurrentSlide] = useState(0);

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

  useEffect(() => {
    setCurrentSlide(0);
  }, [events]);

  useEffect(() => {
    if (events.length <= 1 || paused) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % events.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [events, paused]);

  const visibleEvents = events.slice(
    currentPage * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE + EVENTS_PER_PAGE,
  );
  const featuredEvent = events[currentSlide] ?? visibleEvents[0] ?? null;

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

      <div className="events-grid">
        {visibleEvents.map((event) => (
          <EventCard key={event.id} event={event} onClick={() => onEventClick?.(event)} />
        ))}
      </div>

      {featuredEvent ? (
        <section className="event-slideshow">
          <button
            type="button"
            className="event-slideshow__hero"
            onClick={() => onEventClick?.(featuredEvent)}
          >
            <div className="event-slideshow__media">
              {featuredEvent.image_url ? (
                <img
                  className="event-slideshow__image"
                  src={featuredEvent.image_url}
                  alt={featuredEvent.title}
                  loading="lazy"
                />
              ) : (
                <div className="event-slideshow__image event-slideshow__image--placeholder" />
              )}
              <div className="event-slideshow__overlay" />
              <div className="event-slideshow__date">
                <span className="event-slideshow__month">{featuredEvent.month}</span>
                <span className="event-slideshow__day">{featuredEvent.day}</span>
                <span className="event-slideshow__weekday">{featuredEvent.weekday}</span>
              </div>
            </div>

            <div className="event-slideshow__content">
              <p className="eyebrow">Event Spotlight</p>
              <h3 className="event-slideshow__title">{featuredEvent.title}</h3>
              <div className="event-slideshow__meta">
                <span>{featuredEvent.time}</span>
                <span>{featuredEvent.location}</span>
                {featuredEvent.category ? <span>{featuredEvent.category}</span> : null}
              </div>
              <p className="event-slideshow__description">{featuredEvent.description}</p>
              <div className="event-slideshow__dots" aria-label="Upcoming event slideshow">
                {events.map((event, index) => (
                  <span
                    key={event.id ?? index}
                    className={
                      index === currentSlide
                        ? 'event-slideshow__dot event-slideshow__dot--active'
                        : 'event-slideshow__dot'
                    }
                  />
                ))}
              </div>
            </div>
          </button>

          <div className="event-slideshow__preview-grid" aria-label="Slideshow previews">
            {events.map((event, index) => (
              <button
                key={event.id ?? index}
                type="button"
                className={
                  index === currentSlide
                    ? 'event-slideshow__preview event-slideshow__preview--active'
                    : 'event-slideshow__preview'
                }
                onClick={() => setCurrentSlide(index)}
                aria-label={`Show ${event.title}`}
              >
                {event.image_url ? (
                  <img
                    className="event-slideshow__preview-image"
                    src={event.image_url}
                    alt={event.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="event-slideshow__preview-image event-slideshow__preview-image--placeholder" />
                )}
                <div className="event-slideshow__preview-overlay" />
                <div className="event-slideshow__preview-copy">
                  <span className="event-slideshow__preview-date">
                    {event.month} {event.day}
                  </span>
                  <span className="event-slideshow__preview-title">{event.title}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
