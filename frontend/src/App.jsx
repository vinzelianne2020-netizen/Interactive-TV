import { useEffect, useMemo, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

import { client } from './api/client';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { EventDetailsModal } from './components/EventDetailsModal';
import { EventsSection } from './components/EventsSection';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { StatsGrid } from './components/StatsGrid';
import { AdminPanel } from './admin/AdminPanel';
import { AmenitiesSection } from './sections/AmenitiesSection';
import { AwardsSection } from './sections/AwardsSection';
import { BenefitsSection } from './sections/BenefitsSection';
import { ESGSection } from './sections/ESGSection';
import { HolidaysSection } from './sections/HolidaysSection';
import { NewHiresSection } from './sections/NewHiresSection';
import { SafetySection } from './sections/SafetySection';
import { TrainingSection } from './sections/TrainingSection';
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

const FALLBACK_EVENTS = [
  {
    id: 'fallback-1',
    month: 'JUN',
    day: '02',
    weekday: 'MON',
    time: '10:00 AM',
    location: 'Conference Hall A',
    title: 'Town Hall Meeting',
    description: 'Company updates, plans, and open forum.',
    image_url:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    category: 'Company Event',
  },
  {
    id: 'fallback-2',
    month: 'JUN',
    day: '08',
    weekday: 'SUN',
    time: '09:00 AM',
    location: 'Atrium Lobby',
    title: 'Family Day Celebration',
    description: 'A day of fun, and bonding with families.',
    image_url:
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80',
    category: 'Wellness',
  },
  {
    id: 'fallback-3',
    month: 'JUN',
    day: '15',
    weekday: 'SUN',
    time: '08:00 AM',
    location: 'Company Grounds',
    title: 'Annual Company Picnic',
    description: 'Food, games, and fun for everyone!',
    image_url:
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80',
    category: 'Company Event',
  },
  {
    id: 'fallback-4',
    month: 'JUN',
    day: '17',
    weekday: 'TUE',
    time: '02:00 PM',
    location: 'Training Room 2',
    title: 'Employee Engagement Week',
    description: 'Activities and programs built for you.',
    image_url:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    category: 'Employee Program',
  },
  {
    id: 'fallback-5',
    month: 'JUN',
    day: '24',
    weekday: 'TUE',
    time: '09:00 AM',
    location: 'Executive Conference Room',
    title: 'Leadership Summit',
    description: 'Empowering leaders, inspiring tomorrow.',
    image_url:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    category: 'Leadership',
  },
  {
    id: 'fallback-6',
    month: 'JUN',
    day: '29',
    weekday: 'SUN',
    time: '07:30 AM',
    location: 'Wellness Center',
    title: 'Health & Wellness Month',
    description: 'Your well-being, our priority.',
    image_url:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    category: 'Wellness',
  },
  {
    id: 'fallback-7',
    month: 'JUL',
    day: '04',
    weekday: 'FRI',
    time: '01:30 PM',
    location: 'Innovation Hub',
    title: 'Digital Transformation Forum',
    description: 'Fresh ideas, product demos, and cross-team sharing.',
    image_url:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    category: 'Innovation',
  },
  {
    id: 'fallback-8',
    month: 'JUL',
    day: '09',
    weekday: 'WED',
    time: '11:00 AM',
    location: 'Employee Lounge',
    title: 'Culture & Values Session',
    description: 'Reconnect with our culture, mission, and team values.',
    image_url:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    category: 'Culture',
  },
  {
    id: 'fallback-9',
    month: 'JUL',
    day: '18',
    weekday: 'FRI',
    time: '03:00 PM',
    location: 'Main Auditorium',
    title: 'Customer Success Showcase',
    description: 'Celebrating wins, stories, and service milestones.',
    image_url:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    category: 'Recognition',
  },
  {
    id: 'fallback-10',
    month: 'JUL',
    day: '26',
    weekday: 'SAT',
    time: '08:30 AM',
    location: 'Community Center',
    title: 'Volunteer Outreach Day',
    description: 'Join the community program and outreach activities.',
    image_url:
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80',
    category: 'Community',
  },
];

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Upcoming Events', default: true },
  { key: 'holidays', label: 'Holiday Next Month' },
  { key: 'benefits', label: 'Benefit Releases' },
  { key: 'awards', label: 'Awards' },
  { key: 'new_hires', label: 'New Hire' },
  { key: 'training', label: 'Training Schedules' },
  { key: 'safety', label: 'Safety' },
  { key: 'esg', label: 'ESG' },
  { key: 'amenities', label: 'Amenities' },
];

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
  const navigate = useNavigate();
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
  const boardEvents =
    Array.isArray(eventsQuery.data) && eventsQuery.data.length > 0
      ? eventsQuery.data
      : FALLBACK_EVENTS;

  const rotationSeconds = Number(settings.events_rotation_seconds ?? 24);

  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventsPaused, setEventsPaused] = useState(false);
  const [announcementsPaused, setAnnouncementsPaused] = useState(false);

  const handleNavSelect = (section) => {
    setActiveSection(section);
  };

  const handleOpenAdmin = () => {
    navigate('/admin');
  };

  const handleStatClick = (statKey) => {
    if (statKey === 'upcoming_events') {
      handleNavSelect('dashboard');
    }
    if (statKey === 'safety_score') {
      handleNavSelect('safety');
    }
    if (statKey === 'training_sessions') {
      handleNavSelect('training');
    }
    if (statKey === 'esg_projects') {
      handleNavSelect('esg');
    }
    if (statKey === 'weather') {
      handleNavSelect('amenities');
    }
    if (statKey === 'clock') {
      handleNavSelect('holidays');
    }
  };

  return (
    <div className="tv-stage">
      <div className="tv-canvas" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="stage-orb stage-orb--left" aria-hidden="true" />
        <div className="stage-orb stage-orb--right" aria-hidden="true" />

        <SidebarNav
          items={NAV_ITEMS}
          activeKey={activeSection}
          onSelect={handleNavSelect}
        />

        <main className="dashboard-shell">
          <Header
            title={settings.app_title}
            subtitle={settings.app_subtitle}
            onActionClick={handleOpenAdmin}
          />
          <AnnouncementBanner
            announcements={announcementsQuery.data ?? []}
            fallbackMessage={DEFAULT_SETTINGS.app_subtitle}
            paused={announcementsPaused}
            onTogglePause={() => setAnnouncementsPaused((value) => !value)}
            onSelect={() => handleNavSelect('benefits')}
          />

          {activeSection === 'dashboard' ? (
            <>
              <StatsGrid
                metrics={metricsQuery.data ?? {}}
                weather={weatherQuery.data ?? {}}
                clock={clock}
                onStatClick={handleStatClick}
              />
              <EventsSection
                events={boardEvents}
                rotationSeconds={rotationSeconds}
                kioskMode
                paused={eventsPaused}
                onTogglePause={() => setEventsPaused((value) => !value)}
                onViewAllClick={() => handleNavSelect('holidays')}
                onEventClick={setSelectedEvent}
              />
            </>
          ) : null}

          {activeSection === 'holidays' ? <HolidaysSection /> : null}
          {activeSection === 'benefits' ? <BenefitsSection /> : null}
          {activeSection === 'awards' ? <AwardsSection /> : null}
          {activeSection === 'new_hires' ? <NewHiresSection /> : null}
          {activeSection === 'training' ? <TrainingSection /> : null}
          {activeSection === 'safety' ? <SafetySection /> : null}
          {activeSection === 'esg' ? <ESGSection /> : null}
          {activeSection === 'amenities' ? <AmenitiesSection /> : null}

          <Footer
            message={settings.footer_message}
            thanks={settings.footer_thanks}
            companyName={settings.company_name}
            tagline={settings.company_tagline}
            onClick={() => handleNavSelect('amenities')}
          />
        </main>

        <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
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
