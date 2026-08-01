import { Megaphone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export function AnnouncementBanner({ announcements = [], fallbackMessage = '' }) {
  const activeAnnouncements = useMemo(
    () => announcements.filter((announcement) => announcement?.message),
    [announcements],
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeAnnouncements.length < 2) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((value) => (value + 1) % activeAnnouncements.length);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [activeAnnouncements.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeAnnouncements]);

  const message = activeAnnouncements[currentIndex]?.message ?? fallbackMessage;

  return (
    <section className="announcement-banner">
      <div className="announcement-icon">
        <Megaphone size={28} strokeWidth={2.4} />
      </div>
      <p>{message}</p>
    </section>
  );
}
