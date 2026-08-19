import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Tv,
  User,
  Users2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { client, initCsrfCookie } from '../api/client';

const SECTION_DEFS = {
  events: {
    label: 'Events',
    singular: 'Event',
    icon: CalendarDays,
    endpoint: '/admin/events',
    tone: 'blue',
    color: '#2563eb',
    badge: 'Company Events',
    description: 'Upcoming town halls, activities, and milestones.',
  },
  metrics: {
    label: 'Metrics',
    singular: 'Metric',
    icon: LayoutGrid,
    endpoint: '/admin/metrics',
    tone: 'cyan',
    color: '#0284c7',
    badge: 'Live KPIs',
    description: 'Real-time performance indicators and safety stats.',
  },
  announcements: {
    label: 'Announcements',
    singular: 'Announcement',
    icon: Megaphone,
    endpoint: '/admin/announcements',
    tone: 'indigo',
    color: '#6366f1',
    badge: 'Bulletin Board',
    description: 'High-priority alerts and ticker news items.',
  },
  settings: {
    label: 'Settings',
    singular: 'Setting',
    icon: Settings2,
    endpoint: '/settings',
    tone: 'slate',
    color: '#64748b',
    badge: 'System Config',
    description: 'Global parameters, branding, and calendar files.',
  },
};

const ADMIN_TABS = Object.entries(SECTION_DEFS).map(([key, def]) => ({ key, ...def }));

const QUICK_ACTIONS = [
  { label: 'Create Event', section: 'events', icon: CalendarDays },
  { label: 'Update Metric', section: 'metrics', icon: LayoutGrid },
  { label: 'Post Announcement', section: 'announcements', icon: Megaphone },
  { label: 'System Settings', section: 'settings', icon: Settings2 },
];

const DEFAULT_AUTH = {
  email: '',
  password: '',
};

function sectionFromPath(pathname) {
  const section = pathname.split('/')[2];
  return SECTION_DEFS[section] ? section : 'events';
}

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

function formatDisplayDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  } catch {
    return dateStr;
  }
}

function getEventDateBadge(dateStr) {
  if (!dateStr) return { month: 'TBD', day: '--' };
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return { month: 'TBD', day: '--' };
    return {
      month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d).toUpperCase(),
      day: new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(d),
    };
  } catch {
    return { month: 'TBD', day: '--' };
  }
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
      is_published: Boolean(record.is_published ?? true),
      sort_order: Number(record.sort_order ?? 0),
      image_url: record.image_url ?? null,
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
      is_active: Boolean(record.is_active ?? true),
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
    const dateFormatted = formatDisplayDate(record.event_date) ?? 'Date pending';
    const timeFormatted = record.event_time ? record.event_time.slice(0, 5) : 'All day';
    const loc = record.location || 'Location TBA';
    return `${dateFormatted} • ${timeFormatted} • ${loc}`;
  }

  if (section === 'metrics') {
    return `Key: ${record.key ?? 'metric'} • Current: ${record.value ?? '0'}`;
  }

  if (section === 'announcements') {
    return `${record.is_active ? 'Active on display' : 'Hidden'} • Priority #${record.sort_order ?? 0}`;
  }

  return record.value ? (record.value.length > 60 ? `${record.value.slice(0, 60)}…` : record.value) : 'No value set';
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
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authForm, setAuthForm] = useState(DEFAULT_AUTH);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authFieldErrors, setAuthFieldErrors] = useState({});
  const [activeSection, setActiveSection] = useState(() => sectionFromPath(location.pathname));
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
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [activityCalendarFile, setActivityCalendarFile] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [formFieldErrors, setFormFieldErrors] = useState({});
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    setActiveSection(sectionFromPath(location.pathname));
    setSearchQuery('');
  }, [location.pathname]);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
    }
  }, [imageFile]);

  const greeting = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentRecords;
    }
    const q = searchQuery.toLowerCase().trim();
    return currentRecords.filter((rec) => {
      const title = (rec.title ?? rec.label ?? rec.message ?? rec.key ?? '').toLowerCase();
      const desc = (rec.description ?? rec.value ?? rec.location ?? rec.category ?? '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [currentRecords, searchQuery]);

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
    setConfirmDeleteId(null);
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
      // Keep UI responsive even if session is cleared
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
    navigate(`/admin/${section}`);
    setSaveMessage('');
    setSaveError('');
    setFormFieldErrors({});
    setConfirmDeleteId(null);
  }

  function handleQuickAction(actionSection) {
    navigate(`/admin/${actionSection}`);
    setSelectedRecordId(null);
    setDraft(createEmptyDraft(actionSection));
    setImageFile(null);
    setSaveMessage('');
    setSaveError('');
    setFormFieldErrors({});
    setConfirmDeleteId(null);
  }

  function handleSelectRecord(record) {
    setSelectedRecordId(getRecordId(activeSection, record));
    setDraft(buildDraftFromRecord(activeSection, record));
    setImageFile(null);
    setSaveMessage('');
    setSaveError('');
    setFormFieldErrors({});
    setConfirmDeleteId(null);
  }

  function handleCreateNew() {
    setSelectedRecordId(null);
    setDraft(createEmptyDraft(activeSection));
    setImageFile(null);
    setSaveMessage('');
    setSaveError('');
    setFormFieldErrors({});
    setConfirmDeleteId(null);
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
        payload.append('event_time', draft.event_time ? `${draft.event_time}:00` : '09:00:00');
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
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }

  async function handleActivityCalendarUpload() {
    if (!activityCalendarFile) {
      setSaveError('Choose an activity calendar image or PDF first.');
      return;
    }

    setLoadingAction(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const payload = new FormData();
      payload.append('calendar', activityCalendarFile);
      await client.post('/admin/activity-calendar', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setActivityCalendarFile(null);
      setSaveMessage('Activity calendar uploaded successfully.');
      await loadWorkspace();
    } catch (thrownError) {
      setSaveError(thrownError?.response?.data?.message ?? 'Unable to upload the activity calendar.');
      setFormFieldErrors(thrownError?.response?.data?.errors ?? {});
    } finally {
      setLoadingAction(false);
      setTimeout(() => setSaveMessage(''), 3000);
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
      setConfirmDeleteId(null);
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
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }

  if (isBootstrapping) {
    return (
      <div className="admin-shell admin-shell--auth">
        <section className="admin-auth-card">
          <div className="admin-auth-copy">
            <div className="admin-brand-mark admin-brand-mark--lg">K</div>
            <p className="admin-badge admin-badge--primary">Enterprise Admin</p>
            <h1>Restoring Session</h1>
            <p>Connecting securely to Knowles Connect Control Center...</p>
            <div className="admin-pulse-bar" />
          </div>
        </section>
      </div>
    );
  }

  if (!isAuthenticated) {
    const authValidation = buildValidationSummary(authFieldErrors);
    return (
      <div className="admin-shell admin-shell--auth admin-shell--responsive">
        <div className="admin-auth-ambient-glow" />
        <section className="admin-auth-card admin-auth-card--responsive">
          <div className="admin-auth-copy">
            <div className="admin-auth-brand-row">
              <div className="admin-brand-mark admin-brand-mark--lg">K</div>
              <div>
                <span className="admin-badge admin-badge--primary">Admin Workspace</span>
                <p className="admin-auth-system-label">Knowles Corporation</p>
              </div>
            </div>
            <h1>Knowles Connect Control Center</h1>
            <p>
              Executive management console for company broadcasts, workplace events, live safety metrics, and bulletin updates.
            </p>
            
            <div className="admin-auth-highlights">
              <div className="admin-auth-highlight-item">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>Role-Based Access Control</span>
              </div>
              <div className="admin-auth-highlight-item">
                <Radio size={18} className="text-blue-500" />
                <span>Live Interactive TV Sync</span>
              </div>
            </div>
          </div>

          <form className="admin-auth-form admin-auth-form--responsive" onSubmit={handleLogin} noValidate>
            <div className="admin-auth-form__header">
              <h3>Administrator Sign In</h3>
              <p>Enter your authorized administrator credentials to continue.</p>
            </div>

            <label className="admin-input-group">
              <span className="admin-input-label">Corporate Email</span>
              <div className="admin-input-wrapper">
                <Mail size={17} className="admin-input-icon" />
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="knowlesadmin@knowles.com"
                  autoComplete="email"
                  required
                  maxLength={255}
                  aria-invalid={Boolean(authFieldErrors?.email)}
                />
              </div>
              {authFieldErrors?.email ? (
                <p className="admin-field-error">{authFieldErrors.email[0]}</p>
              ) : null}
            </label>

            <label className="admin-input-group">
              <span className="admin-input-label">Security Password</span>
              <div className="admin-input-wrapper">
                <Lock size={17} className="admin-input-icon" />
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter administrator password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  maxLength={255}
                  aria-invalid={Boolean(authFieldErrors?.password)}
                />
              </div>
              {authFieldErrors?.password ? (
                <p className="admin-field-error">{authFieldErrors.password[0]}</p>
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

            {authError ? (
              <div className="admin-auth-error" role="alert">
                <CircleAlert size={16} />
                <span>{authError}</span>
              </div>
            ) : null}

            <button type="submit" className="admin-button admin-button--primary admin-button--lg" disabled={isSubmittingAuth}>
              {isSubmittingAuth ? (
                <>
                  <RefreshCw size={18} className="admin-spinner" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Control Center</span>
                  <ArrowRight size={18} />
                </>
              )}
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
  const currentDef = SECTION_DEFS[activeSection];
  const selectedLabel =
    selectedRecordId === null
      ? `Create New ${currentDef.singular}`
      : `Editing ${currentDef.singular}`;

  return (
    <div className="admin-shell admin-shell--workspace admin-shell--responsive">
      {/* Side Navigation Rail */}
      <aside className="admin-sidebar admin-sidebar--responsive">
        <div className="admin-sidebar__top">
          <div className="admin-brand-lockup">
            <div className="admin-brand-mark">K</div>
            <div className="admin-brand-info">
              <p className="admin-brand-name">Knowles Connect</p>
              <div className="admin-brand-badge-row">
                <span className="admin-brand-status-dot" />
                <span className="admin-brand-caption">Control Center v2.4</span>
              </div>
            </div>
          </div>

          <div className="admin-sidebar-context">
            <p className="admin-sidebar__eyebrow">Enterprise Hub</p>
            <h2 className="admin-sidebar__title">Workspace</h2>
            <p className="admin-sidebar__date">{greeting}</p>
          </div>

          <div className="admin-nav-section">
            <p className="admin-nav-label">Management Modules</p>
            <nav className="admin-rail admin-rail--responsive" aria-label="Admin sections">
              {ADMIN_TABS.map(({ key, label, icon: Icon, tone: itemTone, badge: tagText }) => {
                const isActive = activeSection === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`admin-rail__item admin-rail__item--${itemTone} ${isActive ? 'admin-rail__item--active' : ''}`}
                    onClick={() => handleTabChange(key)}
                  >
                    <div className="admin-rail__item-lead">
                      <div className="admin-rail__icon-box">
                        <Icon size={19} strokeWidth={2.2} />
                      </div>
                      <div className="admin-rail__item-text">
                        <span className="admin-rail__item-title">{label}</span>
                        <span className="admin-rail__item-sub">{tagText}</span>
                      </div>
                    </div>
                    <span className="admin-rail__badge">{countBadge[key]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="admin-sidebar__bottom">
          <div className="admin-sidebar-status-card">
            <div className="admin-sidebar-status-card__header">
              <Tv size={15} />
              <span>Public TV Broadcast</span>
            </div>
            <p className="admin-sidebar-status-card__text">
              Active &amp; streaming live to all facility display screens.
            </p>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-link-button"
            >
              <span>Preview Live Display</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {currentUser ? (
            <div className="admin-profile-card">
              <div className="admin-profile-avatar">
                <User size={16} />
              </div>
              <div className="admin-profile-info">
                <p className="admin-profile-name">{currentUser.name || 'Administrator'}</p>
                <p className="admin-profile-email">{currentUser.email}</p>
              </div>
              <button
                type="button"
                className="admin-logout-mini-button"
                onClick={handleLogout}
                title="Sign out of Admin"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button type="button" className="admin-logout" onClick={handleLogout}>
              <LogOut size={17} strokeWidth={2.2} />
              <span>Log out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main admin-main--responsive">
        {/* Top Header Command Bar */}
        <header className="admin-main__header admin-main__header--responsive">
          <div className="admin-main__header-lead">
            <div className="admin-breadcrumbs">
              <span>Workspace</span>
              <ArrowRight size={12} />
              <span className="admin-breadcrumbs__active">{currentDef.label}</span>
            </div>
            <h1>{currentDef.badge} Management</h1>
            <p className="admin-main__lead">{currentDef.description}</p>
          </div>

          <div className="admin-main__actions">
            <div className="admin-live-status">
              <span className="admin-live-status__pulse" />
              <span>Display Live</span>
            </div>
            
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-button admin-button--secondary"
            >
              <Eye size={16} />
              <span>Preview TV</span>
            </a>

            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={() => void loadWorkspace()}
              disabled={workspaceLoading}
            >
              <RefreshCw size={16} className={workspaceLoading ? 'admin-spinner' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Global Action Notifications */}
        {saveMessage ? (
          <div className="admin-status admin-status--success" role="status">
            <CheckCircle2 size={18} strokeWidth={2.4} />
            <span>{saveMessage}</span>
          </div>
        ) : null}

        {workspaceError ? (
          <div className="admin-status admin-status--error" role="alert">
            <CircleAlert size={18} strokeWidth={2.4} />
            <span>{workspaceError}</span>
          </div>
        ) : null}

        {/* Executive KPI Stats Cards */}
        <section className="admin-grid admin-grid--responsive" aria-label="Display summary">
          <article className="admin-kpi-card admin-kpi-card--blue">
            <div className="admin-kpi-card__top">
              <span className="admin-kpi-card__label">Upcoming Events</span>
              <div className="admin-kpi-card__icon-box admin-kpi-card__icon-box--blue">
                <CalendarDays size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="admin-kpi-card__bottom">
              <span className="admin-kpi-card__value">{computedSummary.upcoming_events}</span>
              <span className="admin-kpi-card__subchip">Next 30 Days</span>
            </div>
          </article>

          <article className="admin-kpi-card admin-kpi-card--cyan">
            <div className="admin-kpi-card__top">
              <span className="admin-kpi-card__label">Training Sessions</span>
              <div className="admin-kpi-card__icon-box admin-kpi-card__icon-box--cyan">
                <Users2 size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="admin-kpi-card__bottom">
              <span className="admin-kpi-card__value">{computedSummary.training_sessions}</span>
              <span className="admin-kpi-card__subchip">Scheduled</span>
            </div>
          </article>

          <article className="admin-kpi-card admin-kpi-card--indigo">
            <div className="admin-kpi-card__top">
              <span className="admin-kpi-card__label">Safety Score</span>
              <div className="admin-kpi-card__icon-box admin-kpi-card__icon-box--indigo">
                <ShieldCheck size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="admin-kpi-card__bottom">
              <span className="admin-kpi-card__value">{computedSummary.safety_score}</span>
              <span className="admin-kpi-card__subchip admin-kpi-card__subchip--positive">Target Met</span>
            </div>
          </article>

          <article className="admin-kpi-card admin-kpi-card--slate">
            <div className="admin-kpi-card__top">
              <span className="admin-kpi-card__label">ESG Projects</span>
              <div className="admin-kpi-card__icon-box admin-kpi-card__icon-box--slate">
                <LayoutGrid size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="admin-kpi-card__bottom">
              <span className="admin-kpi-card__value">{computedSummary.esg_projects}</span>
              <span className="admin-kpi-card__subchip">In Progress</span>
            </div>
          </article>
        </section>

        {/* Dual Column Record Workspace */}
        <section className="admin-panels admin-panels--responsive">
          {/* Left Column: Record Explorer with Instant Search */}
          <article className="admin-panel admin-panel--responsive">
            <div className="admin-panel__header admin-panel__header--responsive">
              <div>
                <span className="admin-panel__eyebrow">{currentDef.label} Hub</span>
                <h2>{workspaceLoading ? 'Synchronizing...' : `${filteredRecords.length} of ${currentRecords.length} Record(s)`}</h2>
              </div>
              <button type="button" className="admin-button admin-button--primary admin-button--sm" onClick={handleCreateNew}>
                <Plus size={16} strokeWidth={2.4} />
                <span>New {currentDef.singular}</span>
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="admin-search-wrapper">
              <Search size={16} className="admin-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${currentDef.label.toLowerCase()} by title, keyword, or location...`}
                className="admin-search-input"
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            <div className="admin-list admin-list--records admin-list--responsive">
              {filteredRecords.map((record) => {
                const recordId = getRecordId(activeSection, record);
                const isSelected = String(recordId) === String(selectedRecordId);
                const dateBadge = activeSection === 'events' ? getEventDateBadge(record.event_date) : null;

                return (
                  <button
                    key={String(recordId)}
                    type="button"
                    className={`admin-list-card ${isSelected ? 'admin-list-card--active' : ''}`}
                    onClick={() => handleSelectRecord(record)}
                  >
                    {activeSection === 'events' ? (
                      <div className="admin-event-date-chip">
                        <span className="admin-event-date-chip__month">{dateBadge.month}</span>
                        <span className="admin-event-date-chip__day">{dateBadge.day}</span>
                      </div>
                    ) : (
                      <div className={`admin-list-card__icon-bullet admin-list-card__icon-bullet--${currentDef.tone}`}>
                        <currentDef.icon size={16} />
                      </div>
                    )}

                    <div className="admin-list-card__content">
                      <div className="admin-list-card__top">
                        <p className="admin-list-card__title">
                          {record.title ?? record.label ?? record.message ?? record.key ?? 'Untitled Item'}
                        </p>
                        
                        {activeSection === 'events' && record.category ? (
                          <span className="admin-tag admin-tag--category">
                            <Tag size={11} />
                            {record.category}
                          </span>
                        ) : null}

                        {activeSection === 'events' && record.is_published !== undefined ? (
                          <span className={`admin-tag ${record.is_published ? 'admin-tag--success' : 'admin-tag--draft'}`}>
                            {record.is_published ? 'Published' : 'Draft'}
                          </span>
                        ) : null}

                        {activeSection === 'announcements' && record.is_active !== undefined ? (
                          <span className={`admin-tag ${record.is_active ? 'admin-tag--success' : 'admin-tag--draft'}`}>
                            {record.is_active ? 'Active' : 'Paused'}
                          </span>
                        ) : null}
                      </div>

                      <p className="admin-list-card__meta">
                        {summarizeRecord(activeSection, record)}
                      </p>
                    </div>

                    <div className="admin-list-card__arrow">
                      <ArrowRight size={15} />
                    </div>
                  </button>
                );
              })}

              {filteredRecords.length === 0 ? (
                <div className="admin-empty-state">
                  <FileText size={32} strokeWidth={1.5} className="admin-empty-icon" />
                  <h4>{searchQuery ? 'No matching records' : 'No records yet'}</h4>
                  <p>
                    {searchQuery
                      ? `No items found matching "${searchQuery}". Try a different keyword or clear search.`
                      : `Get started by creating your first ${currentDef.singular.toLowerCase()} entry.`}
                  </p>
                  {searchQuery ? (
                    <button
                      type="button"
                      className="admin-button admin-button--secondary admin-button--sm"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear search filter
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-button admin-button--primary admin-button--sm"
                      onClick={handleCreateNew}
                    >
                      <Plus size={15} />
                      <span>Create {currentDef.singular}</span>
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </article>

          {/* Right Column: High-End Record Editor */}
          <article className="admin-panel admin-panel--responsive">
            <div className="admin-panel__header admin-panel__header--responsive">
              <div>
                <span className="admin-panel__eyebrow">Visual Editor</span>
                <h2>{selectedLabel}</h2>
              </div>
              
              {selectedRecordId && activeSection !== 'settings' ? (
                confirmDeleteId === selectedRecordId ? (
                  <div className="admin-confirm-delete-row">
                    <span className="admin-confirm-text">Delete permanently?</span>
                    <button
                      type="button"
                      className="admin-button admin-button--danger-solid admin-button--sm"
                      onClick={handleDeleteRecord}
                      disabled={loadingAction}
                    >
                      <Trash2 size={14} />
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="admin-button admin-button--ghost admin-button--sm"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="admin-button admin-button--danger admin-button--sm"
                    onClick={() => setConfirmDeleteId(selectedRecordId)}
                    disabled={loadingAction}
                  >
                    <Trash2 size={15} strokeWidth={2.2} />
                    <span>Delete</span>
                  </button>
                )
              ) : null}
            </div>

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

            <form className="admin-form admin-form--responsive" onSubmit={handleSaveRecord} noValidate>
              {/* Event Editor Form */}
              {activeSection === 'events' ? (
                <>
                  <label className="admin-input-group">
                    <span className="admin-input-label">Event Title *</span>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                      placeholder="e.g. Annual Leadership Summit 2026"
                      maxLength={255}
                      required
                      className="admin-form-input"
                      aria-invalid={Boolean(formFieldErrors?.title)}
                    />
                    {formFieldErrors?.title ? <p className="admin-field-error">{formFieldErrors.title[0]}</p> : null}
                  </label>

                  <label className="admin-input-group">
                    <span className="admin-input-label">Description &amp; Highlights</span>
                    <textarea
                      rows="3"
                      value={draft.description}
                      onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Enter full schedule, agenda, keynotes, or participant instructions..."
                      maxLength={5000}
                      className="admin-form-textarea"
                    />
                    {formFieldErrors?.description ? <p className="admin-field-error">{formFieldErrors.description[0]}</p> : null}
                  </label>

                  <div className="admin-form__grid admin-form__grid--responsive">
                    <label className="admin-input-group">
                      <span className="admin-input-label">Event Date *</span>
                      <div className="admin-input-wrapper">
                        <Clock size={16} className="admin-input-icon" />
                        <input
                          type="date"
                          value={draft.event_date}
                          onChange={(event) => setDraft((current) => ({ ...current, event_date: event.target.value }))}
                          required
                          className="admin-form-input"
                          aria-invalid={Boolean(formFieldErrors?.event_date)}
                        />
                      </div>
                      {formFieldErrors?.event_date ? <p className="admin-field-error">{formFieldErrors.event_date[0]}</p> : null}
                    </label>

                    <label className="admin-input-group">
                      <span className="admin-input-label">Start Time *</span>
                      <div className="admin-input-wrapper">
                        <Clock size={16} className="admin-input-icon" />
                        <input
                          type="time"
                          value={draft.event_time}
                          onChange={(event) => setDraft((current) => ({ ...current, event_time: event.target.value }))}
                          required
                          className="admin-form-input"
                          aria-invalid={Boolean(formFieldErrors?.event_time)}
                        />
                      </div>
                      {formFieldErrors?.event_time ? <p className="admin-field-error">{formFieldErrors.event_time[0]}</p> : null}
                    </label>
                  </div>

                  <div className="admin-form__grid admin-form__grid--responsive">
                    <label className="admin-input-group">
                      <span className="admin-input-label">Location / Room</span>
                      <div className="admin-input-wrapper">
                        <MapPin size={16} className="admin-input-icon" />
                        <input
                          type="text"
                          value={draft.location}
                          onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
                          placeholder="e.g. Conference Hall A, Main Atrium"
                          maxLength={255}
                          className="admin-form-input"
                        />
                      </div>
                      {formFieldErrors?.location ? <p className="admin-field-error">{formFieldErrors.location[0]}</p> : null}
                    </label>

                    <label className="admin-input-group">
                      <span className="admin-input-label">Category / Department</span>
                      <div className="admin-input-wrapper">
                        <Tag size={16} className="admin-input-icon" />
                        <input
                          type="text"
                          value={draft.category}
                          onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                          placeholder="e.g. Leadership, Wellness, Safety"
                          maxLength={255}
                          className="admin-form-input"
                        />
                      </div>
                      {formFieldErrors?.category ? <p className="admin-field-error">{formFieldErrors.category[0]}</p> : null}
                    </label>
                  </div>

                  <div className="admin-form__grid admin-form__grid--responsive">
                    <label className="admin-input-group">
                      <span className="admin-input-label">Display Sort Priority</span>
                      <input
                        type="number"
                        value={draft.sort_order}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, sort_order: Number(event.target.value) }))
                        }
                        min="0"
                        max="10000"
                        className="admin-form-input"
                      />
                      {formFieldErrors?.sort_order ? <p className="admin-field-error">{formFieldErrors.sort_order[0]}</p> : null}
                    </label>

                    <div className="admin-input-group">
                      <span className="admin-input-label">Cover / Banner Image</span>
                      <div className="admin-file-upload-box">
                        <input
                          type="file"
                          id="event-image-upload"
                          accept="image/*"
                          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                          className="admin-file-input-hidden"
                        />
                        <label htmlFor="event-image-upload" className="admin-file-dropzone">
                          <ImageIcon size={20} className="text-blue-500" />
                          <span>{imageFile ? imageFile.name : (draft.image_url ? 'Replace Event Banner' : 'Select Banner Image')}</span>
                        </label>
                      </div>
                      {formFieldErrors?.image ? <p className="admin-field-error">{formFieldErrors.image[0]}</p> : null}
                    </div>
                  </div>

                  {/* Image Preview if available */}
                  {(imagePreviewUrl || draft.image_url) ? (
                    <div className="admin-image-preview-card">
                      <img
                        src={imagePreviewUrl || draft.image_url}
                        alt="Event Banner Preview"
                        className="admin-image-preview-thumb"
                      />
                      <div className="admin-image-preview-meta">
                        <p className="admin-image-preview-title">{imageFile ? imageFile.name : 'Current Image Banner'}</p>
                        <p className="admin-image-preview-sub">Ready to broadcast with event</p>
                      </div>
                      {imageFile ? (
                        <button
                          type="button"
                          className="admin-clear-image-btn"
                          onClick={() => setImageFile(null)}
                        >
                          <X size={14} />
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Modern Toggle Switch */}
                  <div className="admin-switch-row">
                    <div>
                      <p className="admin-switch-label">Publish on Live Display</p>
                      <p className="admin-switch-desc">When enabled, this event immediately appears on the rotating TV display.</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={draft.is_published}
                      className={`admin-switch-toggle ${draft.is_published ? 'admin-switch-toggle--active' : ''}`}
                      onClick={() => setDraft((current) => ({ ...current, is_published: !current.is_published }))}
                    >
                      <span className="admin-switch-handle" />
                    </button>
                  </div>
                </>
              ) : null}

              {/* Metrics Editor Form */}
              {activeSection === 'metrics' ? (
                <>
                  <div className="admin-form__grid admin-form__grid--responsive">
                    <label className="admin-input-group">
                      <span className="admin-input-label">Unique Identifier Key *</span>
                      <input
                        type="text"
                        value={draft.key}
                        onChange={(event) => setDraft((current) => ({ ...current, key: event.target.value }))}
                        placeholder="e.g. safety_score, training_sessions"
                        maxLength={100}
                        required
                        className="admin-form-input"
                        aria-invalid={Boolean(formFieldErrors?.key)}
                      />
                      {formFieldErrors?.key ? <p className="admin-field-error">{formFieldErrors.key[0]}</p> : null}
                    </label>

                    <label className="admin-input-group">
                      <span className="admin-input-label">Display Metric Label *</span>
                      <input
                        type="text"
                        value={draft.label}
                        onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
                        placeholder="e.g. Safety Compliance Score"
                        maxLength={255}
                        required
                        className="admin-form-input"
                        aria-invalid={Boolean(formFieldErrors?.label)}
                      />
                      {formFieldErrors?.label ? <p className="admin-field-error">{formFieldErrors.label[0]}</p> : null}
                    </label>
                  </div>

                  <div className="admin-form__grid admin-form__grid--responsive">
                    <label className="admin-input-group">
                      <span className="admin-input-label">Current Metric Value *</span>
                      <input
                        type="text"
                        value={draft.value}
                        onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
                        placeholder="e.g. 98%, 24, 1.25x"
                        maxLength={255}
                        required
                        className="admin-form-input"
                        aria-invalid={Boolean(formFieldErrors?.value)}
                      />
                      {formFieldErrors?.value ? <p className="admin-field-error">{formFieldErrors.value[0]}</p> : null}
                    </label>

                    <label className="admin-input-group">
                      <span className="admin-input-label">Icon Identifier</span>
                      <input
                        type="text"
                        value={draft.icon}
                        onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value }))}
                        placeholder="e.g. ShieldCheck, Users2, LayoutGrid"
                        maxLength={100}
                        className="admin-form-input"
                      />
                      {formFieldErrors?.icon ? <p className="admin-field-error">{formFieldErrors.icon[0]}</p> : null}
                    </label>
                  </div>
                </>
              ) : null}

              {/* Announcements Editor Form */}
              {activeSection === 'announcements' ? (
                <>
                  <label className="admin-input-group">
                    <span className="admin-input-label">Broadcast Announcement Message *</span>
                    <textarea
                      rows="4"
                      value={draft.message}
                      onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))}
                      placeholder="Type company news, safety reminder, or employee benefit update..."
                      maxLength={1000}
                      required
                      className="admin-form-textarea"
                      aria-invalid={Boolean(formFieldErrors?.message)}
                    />
                    {formFieldErrors?.message ? <p className="admin-field-error">{formFieldErrors.message[0]}</p> : null}
                  </label>

                  <div className="admin-form__grid admin-form__grid--responsive">
                    <label className="admin-input-group">
                      <span className="admin-input-label">Display Sort Order</span>
                      <input
                        type="number"
                        value={draft.sort_order}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, sort_order: Number(event.target.value) }))
                        }
                        min="0"
                        max="10000"
                        className="admin-form-input"
                      />
                      {formFieldErrors?.sort_order ? <p className="admin-field-error">{formFieldErrors.sort_order[0]}</p> : null}
                    </label>

                    <div className="admin-switch-row admin-switch-row--card">
                      <div>
                        <p className="admin-switch-label">Broadcast Active</p>
                        <p className="admin-switch-desc">Show on news ticker.</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={draft.is_active}
                        className={`admin-switch-toggle ${draft.is_active ? 'admin-switch-toggle--active' : ''}`}
                        onClick={() => setDraft((current) => ({ ...current, is_active: !current.is_active }))}
                      >
                        <span className="admin-switch-handle" />
                      </button>
                    </div>
                  </div>
                </>
              ) : null}

              {/* Settings Editor Form */}
              {activeSection === 'settings' ? (
                <>
                  <div className="admin-upload-card">
                    <div className="admin-upload-card__copy">
                      <div className="admin-upload-card__icon">
                        <CalendarDays size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="admin-upload-card__title">Activity Calendar File</p>
                        <p className="admin-upload-card__hint">
                          Upload high-resolution JPG, PNG, WebP, or PDF to render directly on the interactive TV.
                        </p>
                      </div>
                    </div>

                    <div className="admin-upload-card__controls">
                      <input
                        type="file"
                        id="activity-cal-upload"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(event) => setActivityCalendarFile(event.target.files?.[0] ?? null)}
                        className="admin-file-input-hidden"
                      />
                      <label htmlFor="activity-cal-upload" className="admin-button admin-button--secondary">
                        <ImageIcon size={16} />
                        <span>{activityCalendarFile ? activityCalendarFile.name : 'Choose Calendar File'}</span>
                      </label>
                      <button
                        type="button"
                        className="admin-button admin-button--primary"
                        onClick={() => void handleActivityCalendarUpload()}
                        disabled={loadingAction || !activityCalendarFile}
                      >
                        <Save size={16} />
                        <span>Upload Calendar</span>
                      </button>
                    </div>
                  </div>

                  <label className="admin-input-group">
                    <span className="admin-input-label">Setting Key Identifier *</span>
                    <input
                      type="text"
                      value={draft.key}
                      onChange={(event) => setDraft((current) => ({ ...current, key: event.target.value }))}
                      placeholder="e.g. app_title, footer_message, weather_city"
                      maxLength={100}
                      required
                      className="admin-form-input"
                      aria-invalid={Boolean(formFieldErrors?.key)}
                    />
                    {formFieldErrors?.key ? <p className="admin-field-error">{formFieldErrors.key[0]}</p> : null}
                  </label>

                  <label className="admin-input-group">
                    <span className="admin-input-label">Setting Value / Content *</span>
                    <textarea
                      rows="4"
                      value={draft.value}
                      onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
                      placeholder="Configuration value string..."
                      maxLength={5000}
                      required
                      className="admin-form-textarea"
                      aria-invalid={Boolean(formFieldErrors?.value)}
                    />
                    {formFieldErrors?.value ? <p className="admin-field-error">{formFieldErrors.value[0]}</p> : null}
                  </label>
                </>
              ) : null}

              {/* Form Action Controls */}
              <div className="admin-form__actions admin-form__actions--responsive">
                <button
                  type="submit"
                  className="admin-button admin-button--primary admin-button--md"
                  disabled={loadingAction}
                >
                  {loadingAction ? (
                    <>
                      <RefreshCw size={17} className="admin-spinner" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save size={17} strokeWidth={2.4} />
                      <span>Save {currentDef.singular}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="admin-button admin-button--secondary admin-button--md"
                  onClick={handleCreateNew}
                  disabled={loadingAction}
                >
                  <Plus size={17} strokeWidth={2.4} />
                  <span>Reset Form</span>
                </button>
              </div>
            </form>
          </article>
        </section>

        {/* Quick Launchpad & Facility Activity Grid */}
        <section className="admin-panels admin-panels--responsive">
          <article className="admin-panel admin-panel--responsive">
            <div className="admin-panel__header">
              <div>
                <span className="admin-panel__eyebrow">Fast Workflows</span>
                <h2>Quick Actions</h2>
              </div>
              <Sparkles size={18} className="text-amber-500" />
            </div>

            <div className="admin-quick-actions-grid">
              {QUICK_ACTIONS.map(({ label, section: actionSection, icon: ActionIcon }) => (
                <button
                  key={label}
                  type="button"
                  className="admin-quick-action-card"
                  onClick={() => handleQuickAction(actionSection)}
                >
                  <div className="admin-quick-action-card__icon">
                    <ActionIcon size={20} />
                  </div>
                  <div className="admin-quick-action-card__text">
                    <p className="admin-quick-action-card__title">{label}</p>
                    <p className="admin-quick-action-card__sub">Manage {actionSection}</p>
                  </div>
                  <ArrowRight size={16} className="admin-quick-action-card__arrow" />
                </button>
              ))}
            </div>
          </article>

          <article className="admin-panel admin-panel--responsive">
            <div className="admin-panel__header">
              <div>
                <span className="admin-panel__eyebrow">Display Feed</span>
                <h2>Live Ticker Feed</h2>
              </div>
              <Radio size={18} className="text-blue-500 animate-pulse" />
            </div>

            <div className="admin-list admin-list--responsive">
              {workspace.announcements.slice(0, 3).map((record) => (
                <div key={String(record.id)} className="admin-feed-item">
                  <div className="admin-feed-item__bullet" />
                  <div className="admin-feed-item__content">
                    <p className="admin-feed-item__message">{record.message}</p>
                    <div className="admin-feed-item__meta">
                      <span className="admin-tag admin-tag--success">Live on Ticker</span>
                      <span className="admin-feed-item__time">Order #{record.sort_order}</span>
                    </div>
                  </div>
                </div>
              ))}

              {workspace.announcements.length === 0 ? (
                <div className="admin-empty-state">
                  <FileText size={22} strokeWidth={2} />
                  <p>No active announcements currently in queue.</p>
                </div>
              ) : null}
            </div>
          </article>
        </section>

        {/* Security & System Audit Footer */}
        <section className="admin-footer-card admin-footer-card--responsive">
          <div className="admin-footer-card__copy">
            <div className="admin-footer-shield">
              <ShieldCheck size={22} strokeWidth={2.4} />
            </div>
            <div>
              <p className="admin-footer-card__title">Enterprise Security &amp; Activity Auditing</p>
              <p className="admin-footer-card__meta">
                All changes made in this control center are encrypted, audited, and automatically synced with live facility displays.
              </p>
            </div>
          </div>
          <div className="admin-footer-card__tags">
            <span className="admin-badge admin-badge--neutral">SQLite Verified</span>
            <span className="admin-badge admin-badge--success">Sanctum Stateful</span>
          </div>
        </section>
      </main>
    </div>
  );
}
