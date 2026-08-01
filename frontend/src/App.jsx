import { useEffect, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

import { client } from './api/client';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { EventsSection } from './components/EventsSection';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { StatsGrid } from './components/StatsGrid';
import { AdminPanel } from './admin/AdminPanel';
import { useClock } from './hooks/useClock';
import { usePolling } from './hooks/usePolling';

const BASE_WIDTH = 1080;
const BASE_HEIGHT = 1920;

const DEFAULT_SETTINGS = {
  app_title: 'Knowles Connect',
  app_subtitle:
    'A Digital Interactive Bulletin Board providing employees with real-time access to workplace updates and company announcements.',
  footer_message: 'Together, we build a stronger, safer, and more connected workplace.',
  footer_thanks: 'Thank you for being part of the Knowles family!',
  company_name: 'Knowles',
  company_tagline: 'Life above all',
  weather_city: 'Cebu City, Philippines',
  events_rotation_seconds: '24',
};

function App() {
  const [scale, setScale] = useState(() => calculateScale());

  useEffect(() => {
    const updateScale = () => setScale(calculateScale());

    updateScale();
    window.addEventListener('resize', updateScale);

    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <Routes>
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="*" element={<KioskBoard scale={scale} />} />
    </Routes>
  );
}

function KioskBoard({ scale }) {
  const refreshMs = Number(import.meta.env.VITE_REFRESH_INTERVAL_MS ?? 60000);
  const settingsIntervalMs = 15 * 60 * 1000;

  const eventsQuery = usePolling(
    () => client.get('/events').then(({ data }) => data?.data ?? []),
    refreshMs,
  );
  const metricsQuery = usePolling(
    () => client.get('/metrics').then(({ data }) => data?.data ?? {}),
    refreshMs,
  );
  const announcementsQuery = usePolling(
    () => client.get('/announcements').then(({ data }) => data?.data ?? []),
    settingsIntervalMs,
  );
  const settingsQuery = usePolling(
    () => client.get('/settings').then(({ data }) => data?.data ?? {}),
    settingsIntervalMs,
  );
  const weatherQuery = usePolling(
    () => client.get('/weather').then(({ data }) => data?.data ?? {}),
    settingsIntervalMs,
  );

  const clock = useClock();

  const settings = useMemo(
    () => ({
      ...DEFAULT_SETTINGS,
      ...(settingsQuery.data ?? {}),
    }),
    [settingsQuery.data],
  );

  const rotationSeconds = Number(settings.events_rotation_seconds ?? 24);

  return (
    <div className="tv-stage">
      <div className="tv-canvas" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="stage-orb stage-orb--left" aria-hidden="true" />
        <div className="stage-orb stage-orb--right" aria-hidden="true" />

        <SidebarNav />

        <main className="dashboard-shell">
          <Header title={settings.app_title} subtitle={settings.app_subtitle} />
          <AnnouncementBanner
            announcements={announcementsQuery.data ?? []}
            fallbackMessage={DEFAULT_SETTINGS.app_subtitle}
          />
          <StatsGrid metrics={metricsQuery.data ?? {}} weather={weatherQuery.data ?? {}} clock={clock} />
          <EventsSection
            events={eventsQuery.data ?? []}
            rotationSeconds={rotationSeconds}
            kioskMode
          />
          <Footer
            message={settings.footer_message}
            thanks={settings.footer_thanks}
            companyName={settings.company_name}
            tagline={settings.company_tagline}
          />
        </main>
      </div>
    </div>
  );
}

function calculateScale() {
  if (typeof window === 'undefined') {
    return 1;
  }

  return Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT);
}

export default App;
