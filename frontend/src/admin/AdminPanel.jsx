import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  FileText,
  LayoutGrid,
  LogOut,
  Megaphone,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Users2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { client, initCsrfCookie } from '../api/client';

const SECTION_DEFS = {
  events: {
    label: 'Events',
    icon: CalendarDays,
    endpoint: '/admin/events',
    tone: 'blue',
  },
  metrics: {
    label: 'Metrics',
    icon: LayoutGrid,
    endpoint: '/admin/metrics',
    tone: 'cyan',
  },
  announcements: {
    label: 'Announcements',
    icon: Megaphone,
    endpoint: '/admin/announcements',
    tone: 'indigo',
  },
  settings: {
    label: 'Settings',
    icon: Settings2,
    endpoint: '/settings',
    tone: 'slate',
  },
};

const ADMIN_TABS = Object.entries(SECTION_DEFS).map(([key, def]) => ({ key, ...def }));

const QUICK_ACTIONS = ['Create event', 'Update metric', 'Rotate banner', 'Adjust settings'];

const DEFAULT_AUTH = {
  email: '',
  password: '',
};

function createEmptyDraft(section) {
  if (section === 'events') {
    return {
      title: '',
      description: '',
      event_date: '',
      event_time: '',
      location: '',
      category: '',
      is_published: true,
      sort_order: 0,
    };
  }

  if (section === 'metrics') {
    return {
      key: '',
      label: '',
      value: '',
      icon: '',
    };
  }

  if (section === 'announcements') {
    return {
      message: '',
      is_active: true,
      sort_order: 0,
    };
  }

  return {
    key: '',
    value: '',
  };
}

function getRecordId(section, record) {
  if (!record) {
    return null;
  }

  if (section === 'settings') {
    return record.key;
  }

  return record.id ?? null;
}

function normalizeSettings(recordsObject = {}) {
  return Object.entries(recordsObject).map(([key, value]) => ({ key, value }));
}

function buildDraftFromRecord(section, record) {
  if (!record) {
    return createEmptyDraft(section);
  }

  if (section === 'events') {
    return {
      title: record.title ?? '',
      description: record.description ?? '',
      event_date: record.event_date ?? '',
      event_time: record.event_time ? record.event_time.slice(0, 5) : '',
      location: record.location ?? '',
      category: record.category ?? '',
      is_published: Boolean(record.is_published),
      sort_order: Number(record.sort_order ?? 0),
    };
  }

  if (section === 'metrics') {
    return {
      key: record.key ?? '',
      label: record.label ?? '',
      value: record.value ?? '',
      icon: record.icon ?? '',
    };
  }

  if (section === 'announcements') {
    return {
      message: record.message ?? '',
      is_active: Boolean(record.is_active),
      sort_order: Number(record.sort_order ?? 0),
    };
  }

  return {
    key: record.key ?? '',
    value: record.value ?? '',
  };
}

function summarizeRecord(section, record) {
  if (!record) {
    return '';
  }

  if (section === 'events') {
    return `${record.event_date ?? 'Unknown date'} · ${record.event_time ?? 'All day'} · ${record.location ?? 'No location'}`;
  }

  if (section === 'metrics') {
    return `${record.key ?? 'metric'} · ${record.value ?? '0'}`;
  }

  if (section === 'announcements') {
    return `${record.is_active ? 'Active' : 'Paused'} · ${record.sort_order ?? 0}`;
  }

  return record.value ?? '';
}

function sectionIconTone(section) {
  return SECTION_DEFS[section]?.tone ?? 'blue';
}

function buildValidationSummary(errorBag) {
  if (!errorBag || typeof errorBag !== 'object') {
    return null;
  }
  const flat = [];
  for (const [field, messages] of Object.entries(errorBag)) {
    if (Array.isArray(messages)) {
      for (const message of messages) {
        if (typeof message === 'string') {
          flat.push({ field, message });
        }
      }
    }
  }
  return flat;
}

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authForm, setAuthForm] = useState(DEFAULT_AUTH);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authFieldErrors, setAuthFieldErrors] = useState({});
  const [activeSection, setActiveSection] = useState('events');
  const [workspace, setWorkspace] = useState({
    events: [],
    metrics: [],
    announcements: [],
    settings: [],
  });
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [draft, setDraft] = useState(createEmptyDraft('events'));
  const [imageFile, setImageFile] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [formFieldErrors, setFormFieldErrors] = useState({});
  const [loadingAction, setLoadingAction] = useState(false);

  const greeting = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  }, []);

  const publicMetrics = useMemo(() => {
    return {
      upcoming_events: workspace.events.filter((event) => {
        if (!event?.event_date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(event.event_date) >= today;
      }).length,
      training_sessions: Number(
        workspace.metrics.find((item) => item?.key === 'training_sessions')?.value ?? 0,
      ),
      safety_score: workspace.metrics.find((item) => item?.key === 'safety_score')?.value ?? '0%',
      esg_projects: Number(
        workspace.metrics.find((item) => item?.key === 'esg_projects')?.value ?? 0,
      ),
    };
  }, [workspace]);

  const currentRecords = workspace[activeSection] ?? [];
  const selectedRecord =
    activeSection === 'settings'
      ? currentRecords.find((record) => record.key === selectedRecordId) ?? null
      : currentRecords.find((record) => String(record.id) === String(selectedRecordId)) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await initCsrfCookie();
        const { data } = await client.get('/auth/me');
        if (!cancelled && data?.data) {
          setCurrentUser(data.data);
          setIsAuthenticated(true);
        }
      } catch (_error) {
        // No valid session: let the admin sign in manually.
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void loadWorkspace();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (currentRecords.length === 0) {
      setSelectedRecordId(null);
      setDraft(createEmptyDraft(activeSection));
      setImageFile(null);
      return;
    }

    const selected =
      activeSection === 'settings'
        ? currentRecords.find((record) => record.key === selectedRecordId) ?? currentRecords[0]
        : currentRecords.find((record) => String(record.id) === String(selectedRecordId)) ?? currentRecords[0];

    if (!selectedRecordId || !selected) {
      setSelectedRecordId(getRecordId(activeSection, currentRecords[0]));
      setDraft(buildDraftFromRecord(activeSection, currentRecords[0]));
      setImageFile(null);
    }
  }, [activeSection, currentRecords, isAuthenticated, selectedRecordId]);

  useEffect(() => {
    if (!selectedRecord) {
      setDraft(createEmptyDraft(activeSection));
      setImageFile(null);
      return;
    }

    setDraft(buildDraftFromRecord(activeSection, selectedRecord));
    setImageFile(null);
  }, [activeSection, selectedRecordId]);

  async function loadWorkspace() {
    setWorkspaceLoading(true);
    setWorkspaceError('');

    try {
      const [eventsResponse, metricsResponse, announcementsResponse, settingsResponse] = await Promise.all([
        client.get('/admin/events'),
        client.get('/admin/metrics'),
        client.get('/admin/announcements'),
        client.get('/settings'),
      ]);

      setWorkspace({
        events: eventsResponse.data?.data ?? [],
        metrics: metricsResponse.data?.data ?? [],
        announcements: announcementsResponse.data?.data ?? [],
        settings: normalizeSettings(settingsResponse.data?.data ?? {}),
      });
    } catch (thrownError) {
      const status = thrownError?.response?.status;
      if (status === 401 || status === 403) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setWorkspaceError('Session expired. Please sign in again.');
      } else {
        setWorkspaceError(
          thrownError?.response?.data?.message ?? 'Unable to load admin data right now. Refresh and try again.',
        );
      }
    } finally {
      setWorkspaceLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setIsSubmittingAuth(true);
    setAuthError('');
    setAuthFieldErrors({});

    try {
      await initCsrfCookie();
      const loginResponse = await client.post('/auth/login', authForm);
      setCurrentUser(loginResponse.data?.data ?? null);
      setIsAuthenticated(true);
      setSaveMessage('Signed in successfully.');
      setAuthForm(DEFAULT_AUTH);
      await loadWorkspace();
    } catch (thrownError) {
      const status = thrownError?.response?.status;
      if (status === 429) {
        setAuthError('Too many failed attempts. Please wait a moment and try again.');
      } else {
        setAuthError(
          thrownError?.response?.data?.message ?? 'Unable to sign in right now. Check credentials and try again.',
        );
      }
      setAuthFieldErrors(thrownError?.response?.data?.errors ?? {});
    } finally {
      setIsSubmittingAuth(false);
      setTimeout(() => setSaveMessage(''), 2500);
    }
  }

  async function handleLogout() {
    try {
      await client.post('/auth/logout');
    } catch (_error) {
      // Keep the UI responsive even if the backend session is already gone.
    } finally {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setWorkspace({ events: [], metrics: [], announcements: [], settings: [] });
      setSelectedRecordId(null);
      setDraft(createEmptyDraft('events'));
      setImageFile(null);
      setSaveMessage('Signed out successfully.');
      setTimeout(() => setSaveMessage(''), 2500);
    }
  }

  function handleTabChange(section) {
    setActiveSection(section);
    setSaveMessage('');
    setSaveError('');
    setFormFieldErrors({});
  }

  function handleSelectRecord(record) {
    setSelectedRecordId(getRecordId(activeSection, record));
    setDraft(buildDraftFromRecord(activeSection, record));
    setImageFile(null);
    setSaveMessage('');
    setSaveError('');
    setFormFieldErrors({});
  }

  function handleCreateNew() {
    setSelectedRecordId(null);
    setDraft(createEmptyDraft(activeSection));
    setImageFile(null);
    setSaveMessage('');
    setSaveError('');
    setFormFieldErrors({});
  }

  async function handleSaveRecord(event) {
    event.preventDefault();
    setLoadingAction(true);
    setSaveMessage('');
    setSaveError('');
    setFormFieldErrors({});

    try {
      if (activeSection === 'events') {
        const payload = new FormData();
        payload.append('title', draft.title ?? '');
        payload.append('description', draft.description ?? '');
        payload.append('event_date', draft.event_date ?? '');
        payload.append('event_time', `${draft.event_time ?? ''}:00`);
        payload.append('location', draft.location ?? '');
        payload.append('category', draft.category ?? '');
        payload.append('is_published', draft.is_published ? '1' : '0');
        payload.append('sort_order', String(draft.sort_order ?? 0));

        if (imageFile) {
          payload.append('image', imageFile);
        }

        if (selectedRecordId) {
          await client.post(`/admin/events/${selectedRecordId}?_method=PUT`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          await client.post('/admin/events', payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      if (activeSection === 'metrics') {
        const payload = {
          key: draft.key,
          label: draft.label,
          value: draft.value,
          icon: draft.icon,
        };

        if (selectedRecordId) {
          await client.put(`/admin/metrics/${selectedRecordId}`, payload);
        } else {
          await client.post('/admin/metrics', payload);
        }
      }

      if (activeSection === 'announcements') {
        const payload = {
          message: draft.message,
          is_active: draft.is_active,
          sort_order: Number(draft.sort_order ?? 0),
        };

        if (selectedRecordId) {
          await client.put(`/admin/announcements/${selectedRecordId}`, payload);
        } else {
          await client.post('/admin/announcements', payload);
        }
      }

      if (activeSection === 'settings') {
        await client.put(`/admin/settings/${draft.key}`, { value: draft.value });
      }

      setSaveMessage('Saved successfully.');
      await loadWorkspace();
      if (activeSection !== 'settings') {
        setSelectedRecordId(null);
        setDraft(createEmptyDraft(activeSection));
        setImageFile(null);
      }
    } catch (thrownError) {
      const status = thrownError?.response?.status;
      if (status === 401 || status === 403) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setSaveError('Session expired. Please sign in again.');
      } else {
        setSaveError(
          thrownError?.response?.data?.message ?? 'Unable to save this item right now. Check the form and try again.',
        );
      }
      setFormFieldErrors(thrownError?.response?.data?.errors ?? {});
    } finally {
      setLoadingAction(false);
      if (saveMessage) {
        setTimeout(() => setSaveMessage(''), 2500);
      }
    }
  }

  async function handleDeleteRecord() {
    if (!selectedRecordId || activeSection === 'settings') {
      return;
    }

    setLoadingAction(true);
    setSaveMessage('');
    setSaveError('');

    try {
      if (activeSection === 'events') {
        await client.delete(`/admin/events/${selectedRecordId}`);
      }

      if (activeSection === 'metrics') {
        await client.delete(`/admin/metrics/${selectedRecordId}`);
      }

      if (activeSection === 'announcements') {
        await client.delete(`/admin/announcements/${selectedRecordId}`);
      }

      setSelectedRecordId(null);
      setDraft(createEmptyDraft(activeSection));
      setImageFile(null);
      setSaveMessage('Item deleted.');
      await loadWorkspace();
    } catch (thrownError) {
      const status = thrownError?.response?.status;
      if (status === 401 || status === 403) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setSaveError('Session expired. Please sign in again.');
      } else {
        setSaveError(
          thrownError?.response?.data?.message ?? 'Unable to delete this item right now. Try again.',
        );
      }
    } finally {
      setLoadingAction(false);
      if (saveMessage) {
        setTimeout(() => setSaveMessage(''), 2500);
      }
    }
  }

  if (isBootstrapping) {
    return (
      <div className="admin-shell admin-shell--auth">
        <section className="admin-auth-card">
          <div className="admin-auth-copy">
            <p className="eyebrow">Admin access</p>
            <h1>Checking session…</h1>
            <p>One moment while we restore your admin workspace.</p>
          </div>
        </section>
      </div>
    );
  }

  if (!isAuthenticated) {
    const authValidation = buildValidationSummary(authFieldErrors);
    return (
      <div className="admin-shell admin-shell--auth admin-shell--responsive">
        <section className="admin-auth-card admin-auth-card--responsive">
          <div className="admin-auth-copy">
            <p className="eyebrow">Admin access</p>
            <h1>Knowles Connect control center</h1>
            <p>Sign in to manage events, metrics, announcements, and settings from one place.</p>
            {currentUser ? (
              <p className="admin-auth-copy__hint">
                Signed in as <strong>{currentUser.email}</strong> · {currentUser.role}
              </p>
            ) : null}
          </div>

          <form className="admin-auth-form admin-auth-form--responsive" onSubmit={handleLogin} noValidate>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="knowlesadmin@knowles.com"
                autoComplete="email"
                required
                maxLength={255}
                aria-invalid={Boolean(authFieldErrors?.email)}
                aria-describedby={authFieldErrors?.email ? 'auth-error-email' : undefined}
              />
              {authFieldErrors?.email ? (
                <p className="admin-field-error" id="auth-error-email">{authFieldErrors.email[0]}</p>
              ) : null}
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={255}
                aria-invalid={Boolean(authFieldErrors?.password)}
                aria-describedby={authFieldErrors?.password ? 'auth-error-password' : undefined}
              />
              {authFieldErrors?.password ? (
                <p className="admin-field-error" id="auth-error-password">{authFieldErrors.password[0]}</p>
              ) : null}
            </label>

            {authValidation && authValidation.length > 0 ? (
              <ul className="admin-auth-error-list">
                {authValidation.map((item) => (
                  <li key={`${item.field}-${item.message}`}>
                    <CircleAlert size={14} />
                    <span>{item.message}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {authError ? <p className="admin-auth-error">{authError}</p> : null}

            <button type="submit" className="admin-button" disabled={isSubmittingAuth}>
              {isSubmittingAuth ? 'Signing in...' : 'Sign in'}
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>
          </form>
        </section>
      </div>
    );
  }

  const countBadge = {
    events: workspace.events.length,
    metrics: workspace.metrics.length,
    announcements: workspace.announcements.length,
    settings: workspace.settings.length,
  };

  const computedSummary = publicMetrics;
  const tone = sectionIconTone(activeSection);
  const selectedLabel =
    selectedRecordId === null
      ? `New ${SECTION_DEFS[activeSection].label.slice(0, -1)}`
      : `Editing ${SECTION_DEFS[activeSection].label.slice(0, -1)}`;

  return (
    <div className="admin-shell admin-shell--workspace admin-shell--responsive">
      <aside className="admin-sidebar admin-sidebar--responsive">
        <div>
          <p className="eyebrow">Phase 2 scaffold</p>
          <h2>Control center</h2>
          <p className="admin-sidebar__subtitle">{greeting}</p>
          {currentUser ? (
            <p className="admin-sidebar__whoami">
              <ShieldCheck size={14} strokeWidth={2.4} />
              <span>{currentUser.name ?? currentUser.email}</span>
            </p>
          ) : null}
        </div>

        <nav className="admin-rail admin-rail--responsive" aria-label="Admin sections">
          {ADMIN_TABS.map(({ key, label, icon: Icon, tone: itemTone }) => (
            <button
              key={key}
              type="button"
              className={`admin-rail__item admin-rail__item--${itemTone} ${activeSection === key ? 'admin-rail__item--active' : ''}`}
              onClick={() => handleTabChange(key)}
            >
              <Icon size={20} strokeWidth={2.4} />
              <span>{label}</span>
              <strong>{countBadge[key]}</strong>
            </button>
          ))}
        </nav>

        <button type="button" className="admin-logout" onClick={handleLogout}>
          <LogOut size={18} strokeWidth={2.4} />
          Log out
        </button>
      </aside>

      <main className="admin-main admin-main--responsive">
        <header className="admin-main__header admin-main__header--responsive">
          <div>
            <p className="eyebrow">Workspace overview</p>
            <h1>Manage the public display</h1>
          </div>
          <button type="button" className="admin-button admin-button--ghost" onClick={() => void loadWorkspace()}>
            Refresh data
            <ArrowRight size={18} strokeWidth={2.4} />
          </button>
        </header>

        {saveMessage ? (
          <div className="admin-status admin-status--success" role="status">
            <Save size={18} strokeWidth={2.4} />
            <span>{saveMessage}</span>
          </div>
        ) : null}

        <section className="admin-grid admin-grid--responsive">
          <article className="admin-card admin-card--blue">
            <div className="admin-card__icon">
              <CalendarDays size={22} strokeWidth={2.4} />
            </div>
            <p className="admin-card__label">Upcoming events</p>
            <p className="admin-card__value">{computedSummary.upcoming_events}</p>
          </article>

          <article className="admin-card admin-card--cyan">
            <div className="admin-card__icon">
              <Users2 size={22} strokeWidth={2.4} />
            </div>
            <p className="admin-card__label">Training sessions</p>
            <p className="admin-card__value">{computedSummary.training_sessions}</p>
          </article>

          <article className="admin-card admin-card--indigo">
            <div className="admin-card__icon">
              <ShieldCheck size={22} strokeWidth={2.4} />
            </div>
            <p className="admin-card__label">Safety score</p>
            <p className="admin-card__value">{computedSummary.safety_score}</p>
          </article>

          <article className="admin-card admin-card--slate">
            <div className="admin-card__icon">
              <LayoutGrid size={22} strokeWidth={2.4} />
            </div>
            <p className="admin-card__label">ESG projects</p>
            <p className="admin-card__value">{computedSummary.esg_projects}</p>
          </article>
        </section>

        <section className="admin-panels admin-panels--responsive">
          <article className="admin-panel admin-panel--responsive">
            <div className="admin-panel__header admin-panel__header--responsive">
              <div>
                <p className="eyebrow">{SECTION_DEFS[activeSection].label}</p>
                <h2>{workspaceLoading ? 'Loading records...' : `${currentRecords.length} record(s)`}</h2>
              </div>
              <button type="button" className="admin-button admin-button--ghost" onClick={handleCreateNew}>
                <Plus size={18} strokeWidth={2.4} />
                New
              </button>
            </div>

            {workspaceError ? (
              <div className="admin-status admin-status--error" role="alert">
                <CircleAlert size={18} strokeWidth={2.4} />
                <span>{workspaceError}</span>
              </div>
            ) : null}

            {saveError ? (
              <div className="admin-status admin-status--error" role="alert">
                <CircleAlert size={18} strokeWidth={2.4} />
                <span>{saveError}</span>
              </div>
            ) : null}

            {formFieldErrors && Object.keys(formFieldErrors).length > 0 ? (
              <div className="admin-status admin-status--error admin-status--list" role="alert">
                <CircleAlert size={18} strokeWidth={2.4} />
                <ul>
                  {buildValidationSummary(formFieldErrors)?.slice(0, 6).map((item) => (
                    <li key={`${item.field}-${item.message}`}>{item.field}: {item.message}</li>
                  )) ?? null}
                </ul>
              </div>
            ) : null}

            <div className="admin-list admin-list--records admin-list--responsive">
              {currentRecords.map((record) => {
                const recordId = getRecordId(activeSection, record);
                const isSelected = String(recordId) === String(selectedRecordId);

                return (
                  <button
                    key={String(recordId)}
                    type="button"
                    className={`admin-list__item admin-list__item--button ${isSelected ? 'admin-list__item--active' : ''}`}
                    onClick={() => handleSelectRecord(record)}
                  >
                    <div className={`admin-list__bullet admin-list__bullet--${tone}`} aria-hidden="true" />
                    <div className="admin-list__content">
                      <p className="admin-list__title">
                        {record.title ?? record.label ?? record.message ?? record.key ?? 'Untitled item'}
                      </p>
                      <p className="admin-list__meta">{summarizeRecord(activeSection, record)}</p>
                    </div>
                  </button>
                );
              })}

              {currentRecords.length === 0 ? (
                <div className="admin-empty-state">
                  <FileText size={20} strokeWidth={2.4} />
                  <p>No records yet. Create the first one using the form on the right.</p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="admin-panel admin-panel--responsive">
            <div className="admin-panel__header admin-panel__header--responsive">
              <div>
                <p className="eyebrow">Editor</p>
                <h2>{selectedLabel}</h2>
              </div>
              {selectedRecordId && activeSection !== 'settings' ? (
                <button type="button" className="admin-button admin-button--ghost" onClick={handleDeleteRecord} disabled={loadingAction}>
                  <Trash2 size={18} strokeWidth={2.4} />
                  Delete
                </button>
              ) : null}
            </div>

            <form className="admin-form admin-form--responsive" onSubmit={handleSaveRecord} noValidate>
              {activeSection === 'events' ? (
                <>
                  <label>
                    <span>Title</span>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Town Hall Meeting"
                      maxLength={255}
                      required
                      aria-invalid={Boolean(formFieldErrors?.title)}
                    />
                    {formFieldErrors?.title ? <p className="admin-field-error">{formFieldErrors.title[0]}</p> : null}
                  </label>

                  <label>
                    <span>Description</span>
                    <textarea
                      rows="4"
                      value={draft.description}
                      onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Company updates, plans, and open forum."
                      maxLength={5000}
                    />
                    {formFieldErrors?.description ? <p className="admin-field-error">{formFieldErrors.description[0]}</p> : null}
                  </label>

                  <div className="admin-form__grid admin-form__grid--responsive">
                    <label>
                      <span>Date</span>
                      <input
                        type="date"
                        value={draft.event_date}
                        onChange={(event) => setDraft((current) => ({ ...current, event_date: event.target.value }))}
                        required
                        aria-invalid={Boolean(formFieldErrors?.event_date)}
                      />
                      {formFieldErrors?.event_date ? <p className="admin-field-error">{formFieldErrors.event_date[0]}</p> : null}
                    </label>

                    <label>
                      <span>Time</span>
                      <input
                        type="time"
                        value={draft.event_time}
                        onChange={(event) => setDraft((current) => ({ ...current, event_time: event.target.value }))}
                        required
                        aria-invalid={Boolean(formFieldErrors?.event_time)}
                      />
                      {formFieldErrors?.event_time ? <p className="admin-field-error">{formFieldErrors.event_time[0]}</p> : null}
                    </label>
                  </div>

                  <div className="admin-form__grid admin-form__grid--responsive">
                    <label>
                      <span>Location</span>
                      <input
                        type="text"
                        value={draft.location}
                        onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
                        placeholder="Conference Hall A"
                        maxLength={255}
                      />
                      {formFieldErrors?.location ? <p className="admin-field-error">{formFieldErrors.location[0]}</p> : null}
                    </label>

                    <label>
                      <span>Category</span>
                      <input
                        type="text"
                        value={draft.category}
                        onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                        placeholder="Company Event"
                        maxLength={255}
                      />
                      {formFieldErrors?.category ? <p className="admin-field-error">{formFieldErrors.category[0]}</p> : null}
                    </label>
                  </div>

                  <div className="admin-form__grid admin-form__grid--responsive">
                    <label>
                      <span>Sort order</span>
                      <input
                        type="number"
                        value={draft.sort_order}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, sort_order: Number(event.target.value) }))
                        }
                        min="0"
                        max="10000"
                      />
                      {formFieldErrors?.sort_order ? <p className="admin-field-error">{formFieldErrors.sort_order[0]}</p> : null}
                    </label>

                    <label>
                      <span>Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                      />
                      {formFieldErrors?.image ? <p className="admin-field-error">{formFieldErrors.image[0]}</p> : null}
                    </label>
                  </div>

                  <label className="admin-toggle-row">
                    <input
                      type="checkbox"
                      checked={draft.is_published}
                      onChange={(event) => setDraft((current) => ({ ...current, is_published: event.target.checked }))}
                    />
                    <span>Published</span>
                  </label>
                </>
              ) : null}

              {activeSection === 'metrics' ? (
                <>
                  <div className="admin-form__grid admin-form__grid--responsive">
                    <label>
                      <span>Key</span>
                      <input
                        type="text"
                        value={draft.key}
                        onChange={(event) => setDraft((current) => ({ ...current, key: event.target.value }))}
                        placeholder="training_sessions"
                        maxLength={100}
                        required
                        aria-invalid={Boolean(formFieldErrors?.key)}
                      />
                      {formFieldErrors?.key ? <p className="admin-field-error">{formFieldErrors.key[0]}</p> : null}
                    </label>

                    <label>
                      <span>Label</span>
                      <input
                        type="text"
                        value={draft.label}
                        onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
                        placeholder="Training Sessions"
                        maxLength={255}
                        required
                        aria-invalid={Boolean(formFieldErrors?.label)}
                      />
                      {formFieldErrors?.label ? <p className="admin-field-error">{formFieldErrors.label[0]}</p> : null}
                    </label>
                  </div>

                  <div className="admin-form__grid admin-form__grid--responsive">
                    <label>
                      <span>Value</span>
                      <input
                        type="text"
                        value={draft.value}
                        onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
                        placeholder="12"
                        maxLength={255}
                        required
                        aria-invalid={Boolean(formFieldErrors?.value)}
                      />
                      {formFieldErrors?.value ? <p className="admin-field-error">{formFieldErrors.value[0]}</p> : null}
                    </label>

                    <label>
                      <span>Icon</span>
                      <input
                        type="text"
                        value={draft.icon}
                        onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value }))}
                        placeholder="Users2"
                        maxLength={100}
                      />
                      {formFieldErrors?.icon ? <p className="admin-field-error">{formFieldErrors.icon[0]}</p> : null}
                    </label>
                  </div>
                </>
              ) : null}

              {activeSection === 'announcements' ? (
                <>
                  <label>
                    <span>Message</span>
                    <textarea
                      rows="5"
                      value={draft.message}
                      onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))}
                      placeholder="Stay informed with company announcements..."
                      maxLength={1000}
                      required
                      aria-invalid={Boolean(formFieldErrors?.message)}
                    />
                    {formFieldErrors?.message ? <p className="admin-field-error">{formFieldErrors.message[0]}</p> : null}
                  </label>

                  <div className="admin-form__grid admin-form__grid--responsive">
                    <label>
                      <span>Sort order</span>
                      <input
                        type="number"
                        value={draft.sort_order}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, sort_order: Number(event.target.value) }))
                        }
                        min="0"
                        max="10000"
                      />
                      {formFieldErrors?.sort_order ? <p className="admin-field-error">{formFieldErrors.sort_order[0]}</p> : null}
                    </label>

                    <label className="admin-toggle-row admin-toggle-row--compact">
                      <input
                        type="checkbox"
                        checked={draft.is_active}
                        onChange={(event) => setDraft((current) => ({ ...current, is_active: event.target.checked }))}
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </>
              ) : null}

              {activeSection === 'settings' ? (
                <>
                  <label>
                    <span>Setting key</span>
                    <input
                      type="text"
                      value={draft.key}
                      onChange={(event) => setDraft((current) => ({ ...current, key: event.target.value }))}
                      placeholder="footer_message"
                      maxLength={100}
                      required
                      aria-invalid={Boolean(formFieldErrors?.key)}
                    />
                    {formFieldErrors?.key ? <p className="admin-field-error">{formFieldErrors.key[0]}</p> : null}
                  </label>

                  <label>
                    <span>Setting value</span>
                    <textarea
                      rows="4"
                      value={draft.value}
                      onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
                      placeholder="Together, we build a stronger, safer, and more connected workplace."
                      maxLength={5000}
                      required
                      aria-invalid={Boolean(formFieldErrors?.value)}
                    />
                    {formFieldErrors?.value ? <p className="admin-field-error">{formFieldErrors.value[0]}</p> : null}
                  </label>
                </>
              ) : null}

              <div className="admin-form__actions admin-form__actions--responsive">
                <button type="submit" className="admin-button" disabled={loadingAction}>
                  <Save size={18} strokeWidth={2.4} />
                  {loadingAction ? 'Saving...' : 'Save changes'}
                </button>
                <button type="button" className="admin-button admin-button--ghost" onClick={handleCreateNew} disabled={loadingAction}>
                  <Plus size={18} strokeWidth={2.4} />
                  Clear form
                </button>
              </div>
            </form>
          </article>
        </section>

        <section className="admin-panels admin-panels--responsive">
          <article className="admin-panel admin-panel--responsive">
            <div className="admin-panel__header">
              <div>
                <p className="eyebrow">Quick actions</p>
                <h2>Start here</h2>
              </div>
            </div>
            <div className="admin-action-list admin-action-list--responsive">
              {QUICK_ACTIONS.map((action) => (
                <button key={action} type="button" className="admin-action-chip">
                  {action}
                  <ArrowRight size={16} strokeWidth={2.2} />
                </button>
              ))}
            </div>
          </article>

          <article className="admin-panel admin-panel--responsive">
            <div className="admin-panel__header">
              <div>
                <p className="eyebrow">Recent content</p>
                <h2>Latest updates</h2>
              </div>
            </div>
            <div className="admin-list admin-list--responsive">
              {currentRecords.slice(0, 3).map((record) => (
                <div key={String(getRecordId(activeSection, record))} className="admin-list__item">
                  <div className={`admin-list__bullet admin-list__bullet--${tone}`} aria-hidden="true" />
                  <div>
                    <p className="admin-list__title">
                      {record.title ?? record.label ?? record.message ?? record.key ?? 'Untitled item'}
                    </p>
                    <p className="admin-list__meta">{summarizeRecord(activeSection, record)}</p>
                  </div>
                </div>
              ))}
              {currentRecords.length === 0 ? (
                <div className="admin-empty-state">
                  <FileText size={20} strokeWidth={2.4} />
                  <p>Create your first {SECTION_DEFS[activeSection].label.toLowerCase()} entry to start publishing.</p>
                </div>
              ) : null}
            </div>
          </article>
        </section>

        <section className="admin-footer-card admin-footer-card--responsive">
          <div className="admin-footer-card__copy">
            <ShieldCheck size={20} strokeWidth={2.4} />
            <div>
              <p className="admin-footer-card__title">Protected by role-based access control</p>
              <p className="admin-footer-card__meta">
                All admin actions are validated, sanitized, and logged. Public display remains read-only.
              </p>
            </div>
          </div>
          <p className="admin-footer-card__note">Use this panel for full CRUD across events, metrics, announcements, and settings.</p>
        </section>
      </main>
    </div>
  );
}
