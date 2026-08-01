-- ============================================================
-- Knowles Connect — Interactive TV Bulletin Board
-- Combined migrations + seeders for Supabase (Postgres)
-- Run in Supabase Studio → SQL Editor or via psql
-- ============================================================

BEGIN;

-- ----------------------------------------------------------
-- 1. MIGRATIONS (Laravel default tables + domain tables)
-- ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP(0) WITHOUT TIME ZONE NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,
    role VARCHAR(255) NOT NULL DEFAULT 'editor',
    created_at TIMESTAMP(0) WITHOUT TIME ZONE NULL,
    updated_at TIMESTAMP(0) WITHOUT TIME ZONE NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    email VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(0) WITHOUT TIME ZONE NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload TEXT NOT NULL,
    last_activity INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_last_activity_idx ON sessions (last_activity);

CREATE TABLE IF NOT EXISTS cache (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    expiration INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cache_locks (
    key VARCHAR(255) PRIMARY KEY,
    owner VARCHAR(255) NOT NULL,
    expiration INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    queue VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    attempts SMALLINT NOT NULL,
    reserved_at INTEGER NULL,
    available_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS jobs_queue_idx ON jobs (queue);

CREATE TABLE IF NOT EXISTS job_batches (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_jobs INTEGER NOT NULL,
    pending_jobs INTEGER NOT NULL,
    failed_jobs INTEGER NOT NULL,
    failed_job_ids TEXT NOT NULL,
    options TEXT NULL,
    cancelled_at INTEGER NULL,
    created_at INTEGER NULL,
    finished_at INTEGER NULL
);

CREATE TABLE IF NOT EXISTS failed_jobs (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL UNIQUE,
    connection TEXT NOT NULL,
    queue TEXT NOT NULL,
    payload TEXT NOT NULL,
    exception TEXT NOT NULL,
    failed_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id BIGSERIAL PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT NULL,
    last_used_at TIMESTAMP(0) WITHOUT TIME ZONE NULL,
    expires_at TIMESTAMP(0) WITHOUT TIME ZONE NULL,
    created_at TIMESTAMP(0) WITHOUT TIME ZONE NULL,
    updated_at TIMESTAMP(0) WITHOUT TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS personal_access_tokens_tokenable_idx ON personal_access_tokens (tokenable_type, tokenable_id);

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    event_date DATE NOT NULL,
    event_time TIME(0) WITHOUT TIME ZONE NOT NULL,
    location VARCHAR(255) NULL,
    image_url VARCHAR(255) NULL,
    category VARCHAR(255) NULL,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP(0) WITHOUT TIME ZONE NULL,
    updated_at TIMESTAMP(0) WITHOUT TIME ZONE NULL
);

CREATE TABLE IF NOT EXISTS metrics (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    icon VARCHAR(255) NULL,
    created_at TIMESTAMP(0) WITHOUT TIME ZONE NULL,
    updated_at TIMESTAMP(0) WITHOUT TIME ZONE NULL
);

CREATE TABLE IF NOT EXISTS announcements (
    id BIGSERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP(0) WITHOUT TIME ZONE NULL,
    updated_at TIMESTAMP(0) WITHOUT TIME ZONE NULL
);

CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at TIMESTAMP(0) WITHOUT TIME ZONE NULL,
    updated_at TIMESTAMP(0) WITHOUT TIME ZONE NULL
);

-- Laravel migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    migration VARCHAR(255) NOT NULL,
    batch INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS migrations_migration_unique ON migrations (migration);

INSERT INTO migrations (migration, batch) VALUES
    ('0001_01_01_000000_create_users_table', 1),
    ('0001_01_01_000001_create_cache_table', 1),
    ('0001_01_01_000002_create_jobs_table', 1),
    ('2026_08_01_124724_create_personal_access_tokens_table', 1),
    ('2026_08_01_130042_create_events_table', 1),
    ('2026_08_01_130044_create_metrics_table', 1),
    ('2026_08_01_130046_create_announcements_table', 1),
    ('2026_08_01_130048_create_settings_table', 1),
    ('2026_08_01_130049_add_role_to_users_table', 1)
ON CONFLICT (migration) DO NOTHING;

-- ----------------------------------------------------------
-- 2. SEEDERS (sample data matching the reference mockup)
-- ----------------------------------------------------------

-- events
INSERT INTO events (title, description, event_date, event_time, location, image_url, category, is_published, sort_order, created_at, updated_at) VALUES
    ('Town Hall Meeting', 'Company updates, plans, and open forum.', '2026-08-03', '10:00:00', 'Conference Hall A', 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80', 'Company Event', TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Family Day Celebration', 'A day of fun, games, and bonding with families.', '2026-08-08', '09:00:00', 'Atrium Lobby', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80', 'Wellness', TRUE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Annual Company Picnic', 'Food, games, and fun for everyone!', '2026-08-15', '08:00:00', 'Company Grounds', 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80', 'Company Event', TRUE, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Employee Engagement Week', 'Activities and programs built for you.', '2026-08-17', '14:00:00', 'Training Room 2', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80', 'Company Event', TRUE, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Leadership Summit', 'Empowering leaders, inspiring tomorrow.', '2026-08-24', '09:00:00', 'Executive Conference Room', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80', 'Leadership', TRUE, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Health & Wellness Month', 'Your well-being, our priority.', '2026-08-29', '07:30:00', 'Wellness Center', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80', 'Wellness', TRUE, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- metrics
INSERT INTO metrics (key, label, value, icon, created_at, updated_at) VALUES
    ('training_sessions', 'Training Sessions', '12', 'Users2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('safety_score', 'Safety Score', '98%', 'ShieldCheck', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('esg_projects', 'ESG Projects', '8', 'Leaf', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, value = EXCLUDED.value, icon = EXCLUDED.icon, updated_at = CURRENT_TIMESTAMP;

-- announcements
INSERT INTO announcements (message, is_active, sort_order, created_at, updated_at) VALUES
    ('Stay informed with company announcements, employee programs, safety campaigns, ESG initiatives, and workplace updates.', TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Remember to check the latest wellness and training schedules in the admin portal.', TRUE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- settings
INSERT INTO settings (key, value, created_at, updated_at) VALUES
    ('app_title', 'Knowles Connect', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('app_subtitle', 'A Digital Interactive Bulletin Board providing employees with real-time access to workplace updates and company announcements.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('footer_message', 'Together, we build a stronger, safer, and more connected workplace.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('footer_thanks', 'Thank you for being part of the Knowles family!', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('company_name', 'Knowles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('company_tagline', 'Life above all', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('weather_city', 'Cebu City, Philippines', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('events_rotation_seconds', '24', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;

COMMIT;
