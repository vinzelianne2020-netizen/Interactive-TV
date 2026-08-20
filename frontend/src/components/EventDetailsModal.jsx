import { Clock3, MapPin, X } from 'lucide-react';
import { useEffect } from 'react';

export function EventDetailsModal({ event, onClose }) {
  useEffect(() => {
    if (!event) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [event, onClose]);

  if (!event) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
      onClick={() => onClose?.()}
    >
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>

        {/* Close button — always on top-right */}
        <button
          type="button"
          className="modal-close"
          aria-label="Close event details"
          onClick={() => onClose?.()}
        >
          <X size={19} strokeWidth={2.6} />
        </button>

        {/* ══ LEFT: Full image, scrollable if tall ══ */}
        <div className="modal-media">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="modal-image" />
          ) : (
            <div className="modal-image modal-image--placeholder" />
          )}

          {/* Glassmorphism date badge */}
          <div className="modal-date-badge">
            <span className="event-card__month">{event.month}</span>
            <span className="event-card__day">{event.day}</span>
            <span className="event-card__weekday">{event.weekday}</span>
          </div>
        </div>

        {/* ══ RIGHT: Content — always fully visible ══ */}
        <div className="modal-content-col">
          <div className="modal-body">
            <p className="eyebrow">Event Details</p>

            <h2 id="event-modal-title" className="modal-title">
              {event.title}
            </h2>

            <hr className="modal-divider" />

            <div className="modal-meta-row">
              <div className="modal-meta-pill">
                <Clock3 size={15} strokeWidth={2.4} />
                <span>{event.time ?? 'All day'}</span>
              </div>
              <div className="modal-meta-pill">
                <MapPin size={15} strokeWidth={2.4} />
                <span>{event.location ?? 'To be announced'}</span>
              </div>
              {event.category ? (
                <div className="modal-meta-pill modal-meta-pill--accent">
                  <span>{event.category}</span>
                </div>
              ) : null}
            </div>

            <hr className="modal-divider" />

            <div
              className="modal-description rich-text-output"
              dangerouslySetInnerHTML={{
                __html: event.description ?? 'No description available yet.',
              }}
            />
          </div>

          {/* Sticky footer */}
          <div className="modal-footer">
            <button type="button" className="modal-primary" onClick={() => onClose?.()}>
              Got it
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
