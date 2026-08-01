import { ChevronLeft, ChevronRight, Megaphone, Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export function AnnouncementBanner({
  announcements = [],
  fallbackMessage = '',
  paused = false,
  onTogglePause,
  onSelect,
}) {
  const activeAnnouncements = useMemo(
    () => announcements.filter((announcement) => announcement?.message),
    [announcements],
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeAnnouncements.length < 2 || paused) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((value) => (value + 1) % activeAnnouncements.length);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [activeAnnouncements.length, paused]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeAnnouncements]);

  const handleNext = () => {
    setCurrentIndex((value) => (value + 1) % Math.max(activeAnnouncements.length, 1));
  };

  const handlePrev = () => {
    setCurrentIndex(
      (value) =>
        (value - 1 + Math.max(activeAnnouncements.length, 1)) %
        Math.max(activeAnnouncements.length, 1),
    );
  };

  const message = activeAnnouncements[currentIndex]?.message ?? fallbackMessage;

  return (
    <section className="announcement-banner" onClick={() => onSelect?.()}>
      <button
        type="button"
        className="announcement-control announcement-control--left"
        aria-label="Previous announcement"
        onClick={(event) => {
          event.stopPropagation();
          handlePrev();
        }}
      >
        <ChevronLeft size={22} strokeWidth={2.4} />
      </button>

      <div className="announcement-icon">
        <Megaphone size={28} strokeWidth={2.4} />
      </div>
      <p>{message}</p>

      <div className="announcement-banner__actions">
        {activeAnnouncements.length > 1 ? (
          <div className="announcement-dots" role="tablist" aria-label="Announcements">
            {activeAnnouncements.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`Go to announcement ${index + 1}`}
                className={
                  index === currentIndex
                    ? 'announcement-dot announcement-dot--active'
                    : 'announcement-dot'
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setCurrentIndex(index);
                }}
              />
            ))}
          </div>
        ) : null}
        <button
          type="button"
          className="announcement-control announcement-control--pause"
          aria-label={paused ? 'Resume auto-rotate' : 'Pause auto-rotate'}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePause?.();
          }}
        >
          {paused ? <Play size={18} strokeWidth={2.4} /> : <Pause size={18} strokeWidth={2.4} />}
        </button>
      </div>

      <button
        type="button"
        className="announcement-control announcement-control--right"
        aria-label="Next announcement"
        onClick={(event) => {
          event.stopPropagation();
          handleNext();
        }}
      >
        <ChevronRight size={22} strokeWidth={2.4} />
      </button>
    </section>
  );
}
