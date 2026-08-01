import { ArrowRight, CalendarDays, LayoutGrid, LogOut, Megaphone, Settings2, ShieldCheck, Users2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { client } from '../api/client';

const ADMIN_SECTIONS = [
  { label: 'Events', icon: CalendarDays, count: 6, tone: 'blue' },
  { label: 'Metrics', icon: LayoutGrid, count: 4, tone: 'cyan' },
  { label: 'Announcements', icon: Megaphone, count: 2, tone: 'indigo' },
  { label: 'Settings', icon: Settings2, count: 7, tone: 'slate' },
];

const QUICK_ACTIONS = [
  'Create event',
  'Update metric',
  'Rotate banner',
  'Adjust settings',
];

const RECENT_ITEMS = [
  {
    title: 'Town Hall Meeting',
    meta: 'Published · next Tuesday · Conference Hall A',
  },
  {
    title: 'Safety Score',
    meta: '98% · updated by EHS',
  },
  {
    title: 'Main Banner',
    meta: 'Active · rotating every 8s',
  },
];

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const greeting = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await client.get('/sanctum/csrf-cookie');
      await client.post('/auth/login', formState);
      setIsAuthenticated(true);
    } catch (thrownError) {
      setErrorMessage(
        thrownError?.response?.data?.message ?? 'Unable to sign in right now. Check credentials and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await client.post('/auth/logout');
    } catch (_error) {
      // Keep the UI responsive even if the backend session is already gone.
    } finally {
      setIsAuthenticated(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-shell admin-shell--auth">
        <section className="admin-auth-card">
          <div className="admin-auth-copy">
            <p className="eyebrow">Admin access</p>
            <h1>Knowles Connect control center</h1>
            <p>
              Sign in to manage events, metrics, announcements, and settings from one place.
            </p>
          </div>

          <form className="admin-auth-form" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={formState.email}
                onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                placeholder="admin@knowles.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={formState.password}
                onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </label>

            {errorMessage ? <p className="admin-auth-error">{errorMessage}</p> : null}

            <button type="submit" className="admin-button" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-shell admin-shell--workspace">
      <aside className="admin-sidebar">
        <div>
          <p className="eyebrow">Phase 2 scaffold</p>
          <h2>Control center</h2>
          <p className="admin-sidebar__subtitle">{greeting}</p>
        </div>

        <nav className="admin-rail" aria-label="Admin sections">
          {ADMIN_SECTIONS.map(({ label, icon: Icon, tone }) => (
            <button key={label} type="button" className={`admin-rail__item admin-rail__item--${tone}`}>
              <Icon size={20} strokeWidth={2.4} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button type="button" className="admin-logout" onClick={handleLogout}>
          <LogOut size={18} strokeWidth={2.4} />
          Log out
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-main__header">
          <div>
            <p className="eyebrow">Workspace overview</p>
            <h1>Manage the public display</h1>
          </div>
          <button type="button" className="admin-button admin-button--ghost">
            New item
            <ArrowRight size={18} strokeWidth={2.4} />
          </button>
        </header>

        <section className="admin-grid">
          {ADMIN_SECTIONS.map(({ label, icon: Icon, count, tone }) => (
            <article key={label} className={`admin-card admin-card--${tone}`}>
              <div className="admin-card__icon">
                <Icon size={22} strokeWidth={2.4} />
              </div>
              <div>
                <p className="admin-card__label">{label}</p>
                <p className="admin-card__value">{count}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="admin-panels">
          <article className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <p className="eyebrow">Quick actions</p>
                <h2>Start here</h2>
              </div>
            </div>
            <div className="admin-action-list">
              {QUICK_ACTIONS.map((action) => (
                <button key={action} type="button" className="admin-action-chip">
                  {action}
                  <ArrowRight size={16} strokeWidth={2.2} />
                </button>
              ))}
            </div>
          </article>

          <article className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <p className="eyebrow">Recent content</p>
                <h2>Latest updates</h2>
              </div>
            </div>
            <div className="admin-list">
              {RECENT_ITEMS.map((item) => (
                <div key={item.title} className="admin-list__item">
                  <div className="admin-list__bullet" aria-hidden="true" />
                  <div>
                    <p className="admin-list__title">{item.title}</p>
                    <p className="admin-list__meta">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="admin-footer-card">
          <div className="admin-footer-card__copy">
            <ShieldCheck size={20} strokeWidth={2.4} />
            <div>
              <p className="admin-footer-card__title">Protected by Sanctum</p>
              <p className="admin-footer-card__meta">Public display remains read-only.</p>
            </div>
          </div>
          <p className="admin-footer-card__note">Use this panel later for full CRUD flows.</p>
        </section>
      </main>
    </div>
  );
}
