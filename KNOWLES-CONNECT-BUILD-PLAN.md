# Knowles Connect — Interactive TV Bulletin Board
## Full-Stack Build Plan (Laravel API + React Frontend + Supabase Postgres)

> **Audience:** GitHub Copilot Agent (VS Code), executing this plan step-by-step inside the repo
> `https://github.com/vinzelianne2020-netizen/Interactive-TV.git`
>
> **Target display:** Single-purpose kiosk TV, **1080 × 1920 portrait**, always-on, auto-refreshing, no user login required (public read-only display). Content is managed by an authenticated admin panel (phase 2, scaffolded now).

---

## 0. How Copilot Agent Should Use This Document

1. Treat every `### Task X.Y` block as one unit of work — create the files listed, run the commands listed, then move to the next task in order.
2. Do not skip Section 2 (repo scaffolding) and Section 3 (Supabase schema) — everything else depends on them.
3. Never hardcode secrets in source files. All secrets go into `.env` files that are **git-ignored**. Section 1.3 explains exactly what goes where.
4. After each major section, run the "Definition of Done" checklist before continuing.

---

## 1. Architecture Overview

### 1.1 High-level diagram

```
┌─────────────────────────────┐        ┌──────────────────────────────┐        ┌────────────────────────┐
│   React 18 Frontend (TV)     │  REST  │   Laravel 11 API Backend      │  PDO   │   Supabase (Postgres)  │
│   - Vite build                │◄──────►│   - Sanctum (admin auth)      │◄──────►│   - events              │
│   - Kiosk / TV display        │  JSON  │   - Eloquent models           │  SSL   │   - metrics             │
│   - Auto-refresh every 60s    │        │   - Weather proxy (cache)     │        │   - weather_cache        │
│   - Admin panel (CRUD)        │        │   - Image upload -> Supabase  │        │   - settings/announce.   │
│                                │        │     Storage                   │        │   - admin_users          │
└─────────────────────────────┘        └──────────────────────────────┘        └────────────────────────┘
        Port 5173 (dev)                        Port 8000 (dev)                    tugkybqqqembvqingyzr.supabase.co
```

**Why this split:**
- **Laravel** is the single source of truth for business logic (event ordering, stats aggregation, weather caching so we don't hit rate limits, image handling) and is what Copilot will scaffold as `/backend`.
- **React (Vite)** renders the actual bulletin board and is what runs full-screen on the TV. It only talks to the Laravel API — it never talks to Supabase directly, so the Supabase service key never ships to the browser.
- **Supabase** is used purely as managed Postgres + file storage. Laravel connects to it exactly like any Postgres database via the connection string, and separately uses the Supabase Storage REST API (via the publishable key) for image uploads if desired.

### 1.2 Repository layout (monorepo)

```
Interactive-TV/
├── backend/                # Laravel 11 project
│   ├── app/
│   ├── routes/api.php
│   ├── database/migrations/
│   ├── .env.example
│   └── .env                # gitignored — real secrets live here
├── frontend/                # React + Vite project
│   ├── src/
│   ├── .env.example
│   └── .env                # gitignored
├── .gitignore
└── README.md
```

### 1.3 Secrets — where each one lives

| Secret | Lives in | Notes |
|---|---|---|
| Supabase DB password (`T6EX.su$H.nHZd9`) | `backend/.env` → `DB_PASSWORD` | Never committed. Rotate this password in the Supabase dashboard once local setup is confirmed working, since it was shared in plain text during planning. |
| Supabase Project URL | `backend/.env` → `SUPABASE_URL`, and `frontend/.env` → `VITE_SUPABASE_URL` (only if frontend ever needs it for public asset URLs) | Safe to expose publicly. |
| Supabase publishable (anon) key | `backend/.env` → `SUPABASE_PUBLISHABLE_KEY` | This key is safe for client-side/public use by design, but we still keep frontend Supabase-free for this project — Laravel proxies everything. |
| Direct Postgres connection string | Split into `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` in `backend/.env` | Laravel's `config/database.php` `pgsql` connection uses these, not the raw string. |

> ⚠️ **Security note for the developer (you), not Copilot:** because the DB password and keys were pasted into this planning conversation, treat them as semi-exposed. After first successful connection, go to **Supabase → Project Settings → Database → Reset Password**, and update `backend/.env` with the new password. This costs 2 minutes and removes any risk from this document circulating.

---

## 2. Repository & Environment Scaffolding

### [x] Task 2.1 — Clone and init structure
```bash
git clone https://github.com/vinzelianne2020-netizen/Interactive-TV.git
cd Interactive-TV
mkdir backend frontend
```

### [x] Task 2.2 — Root `.gitignore`
Create `/.gitignore`:
```gitignore
# Env files
**/.env
**/.env.*
!**/.env.example

# Laravel
backend/vendor/
backend/node_modules/
backend/storage/*.key
backend/bootstrap/cache/*.php

# React
frontend/node_modules/
frontend/dist/

# OS/editor
.DS_Store
.vscode/*
!.vscode/extensions.json
```

### [x] Task 2.3 — Scaffold Laravel backend
```bash
cd backend
composer create-project laravel/laravel . "^11.0"
composer require laravel/sanctum guzzlehttp/guzzle
php artisan install:api
```

### [x] Task 2.4 — Configure Laravel to use Supabase Postgres
Edit `backend/.env` (create from `.env.example`, then fill in):
```env
APP_NAME="Knowles Connect"
APP_ENV=local
APP_KEY=            # generated by php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000
APP_TIMEZONE=Asia/Manila

DB_CONNECTION=pgsql
DB_HOST=db.tugkybqqqembvqingyzr.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=T6EX.su$H.nHZd9
DB_SSLMODE=require

SUPABASE_URL=https://tugkybqqqembvqingyzr.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_olwJdELypgad5X6AbdAKpw_pJc7vTkQ

WEATHER_API_KEY=            # get free key from openweathermap.org
WEATHER_LAT=10.3103
WEATHER_LON=123.8854
WEATHER_CITY="Cebu City, Philippines"

FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DOMAIN=localhost
```

Create `backend/.env.example` as a copy of the above with all secret values blanked out (`DB_PASSWORD=`, `SUPABASE_PUBLISHABLE_KEY=`, etc.) — this is the file that actually gets committed.

In `backend/config/database.php`, confirm the `pgsql` connection block reads from these env vars (Laravel does this by default) and add SSL:
```php
'pgsql' => [
    'driver' => 'pgsql',
    'host' => env('DB_HOST'),
    'port' => env('DB_PORT', '5432'),
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
    'sslmode' => env('DB_SSLMODE', 'prefer'),
],
```

### Task 2.5 — Verify DB connection
```bash
php artisan tinker
>>> DB::connection()->getPdo();
```
**Definition of Done:** returns a `PDO` object with no errors.

### [x] Task 2.6 — Scaffold React frontend
```bash
cd ../frontend
npm create vite@latest . -- --template react
npm install
npm install axios react-router-dom date-fns lucide-react
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_REFRESH_INTERVAL_MS=60000
```
Create matching `frontend/.env.example` with blank/placeholder values.

---

## 3. Supabase Database Schema

Run these as Laravel migrations (`php artisan make:migration ...`) so schema is version-controlled — do **not** hand-edit tables in the Supabase Studio UI except for one-off data fixes.

### [x] Task 3.1 — `events` table
```php
Schema::create('events', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('description')->nullable();
    $table->date('event_date');
    $table->time('event_time');
    $table->string('location')->nullable();
    $table->string('image_url')->nullable();   // Supabase Storage public URL
    $table->string('category')->nullable();    // e.g. "Company Event", "Wellness"
    $table->boolean('is_published')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});
```

### [x] Task 3.2 — `metrics` table (the 4 stat cards: Upcoming Events, Training Sessions, Safety Score, ESG Projects)
```php
Schema::create('metrics', function (Blueprint $table) {
    $table->id();
    $table->string('key')->unique();   // 'upcoming_events','training_sessions','safety_score','esg_projects'
    $table->string('label');
    $table->string('value');           // stored as string to support "98%" and "15"
    $table->string('icon')->nullable();
    $table->timestamps();
});
```
`upcoming_events` and `esg_projects` can be **computed** live from the `events`/`esg_projects` tables instead of manually maintained — see Task 4.3. `training_sessions` and `safety_score` are manually updated by HR/EHS admins via the admin panel.

### [x] Task 3.3 — `announcements` table (the blue banner text, supports rotating multiple banners)
```php
Schema::create('announcements', function (Blueprint $table) {
    $table->id();
    $table->text('message');
    $table->boolean('is_active')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});
```

### [x] Task 3.4 — `settings` table (footer text, company name, weather location, branding)
```php
Schema::create('settings', function (Blueprint $table) {
    $table->id();
    $table->string('key')->unique();
    $table->text('value');
    $table->timestamps();
});
```
Seed keys: `app_title` ("Knowles Connect"), `app_subtitle`, `footer_message`, `footer_thanks`, `company_name` ("Knowles"), `company_tagline` ("Life above all"), `weather_city`.

### [x] Task 3.5 — `admin_users` (Laravel default `users` table works fine)
Use Laravel's default migration, add a `role` column:
```php
$table->string('role')->default('editor'); // 'admin' | 'editor'
```

### Task 3.6 — Run migrations against Supabase
```bash
cd backend
php artisan migrate
```
**Definition of Done:** `php artisan migrate:status` shows all migrations as `Ran`, and tables are visible in Supabase Studio → Table Editor.

### [x] Task 3.7 — Seeders (sample data matching the mockup)
Create `EventSeeder`, `MetricSeeder`, `AnnouncementSeeder`, `SettingSeeder` matching the reference image content (Town Hall Meeting, Family Day Celebration, Annual Company Picnic, Employee Engagement Week, Leadership Summit, Health & Wellness Month), then:
```bash
php artisan db:seed
```

---

## 4. Laravel Backend — API Layer

### [x] Task 4.1 — Route file `backend/routes/api.php`
```php
use App\Http\Controllers\Api\{EventController, MetricController, AnnouncementController, SettingController, WeatherController, AuthController};

// Public — consumed by the TV display, no auth required
Route::get('/events', [EventController::class, 'index']);
Route::get('/metrics', [MetricController::class, 'index']);
Route::get('/announcements', [AnnouncementController::class, 'index']);
Route::get('/settings', [SettingController::class, 'index']);
Route::get('/weather', [WeatherController::class, 'current']);
Route::get('/clock', fn () => response()->json(['now' => now()->toIso8601String(), 'timezone' => config('app.timezone')]));

// Admin — protected by Sanctum
Route::post('/auth/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::apiResource('/admin/events', EventController::class)->except(['index']);
    Route::apiResource('/admin/metrics', MetricController::class)->except(['index']);
    Route::apiResource('/admin/announcements', AnnouncementController::class)->except(['index']);
    Route::put('/admin/settings/{key}', [SettingController::class, 'update']);
});
```

### [x] Task 4.2 — `EventController@index`
Returns published, future-or-today events ordered by date, formatted for the card layout:
```php
public function index()
{
    $events = Event::where('is_published', true)
        ->whereDate('event_date', '>=', now()->subDay())
        ->orderBy('event_date')
        ->orderBy('sort_order')
        ->take(6)
        ->get()
        ->map(fn ($e) => [
            'id' => $e->id,
            'month' => $e->event_date->format('M'),
            'day' => $e->event_date->format('d'),
            'weekday' => $e->event_date->format('D'),
            'time' => $e->event_time->format('h:i A'),
            'location' => $e->location,
            'title' => $e->title,
            'description' => $e->description,
            'image_url' => $e->image_url,
        ]);

    return response()->json(['data' => $events]);
}
```

### [x] Task 4.3 — `MetricController@index` (auto-computes where possible)
```php
public function index()
{
    $upcomingCount = Event::where('is_published', true)
        ->whereDate('event_date', '>=', now())->count();

    $stored = Metric::pluck('value', 'key');

    return response()->json(['data' => [
        'upcoming_events' => $upcomingCount,
        'training_sessions' => $stored['training_sessions'] ?? 0,
        'safety_score' => $stored['safety_score'] ?? '0%',
        'esg_projects' => $stored['esg_projects'] ?? 0,
    ]]);
}
```

### [x] Task 4.4 — `WeatherController@current` (server-side cache to avoid rate limits)
Use Laravel's cache (file or database driver) with a 15-minute TTL, calling OpenWeatherMap (or the free Open-Meteo API, which needs no API key — recommended to avoid another secret):
```php
public function current()
{
    return Cache::remember('weather:current', now()->addMinutes(15), function () {
        $lat = config('services.weather.lat');
        $lon = config('services.weather.lon');
        $resp = Http::get('https://api.open-meteo.com/v1/forecast', [
            'latitude' => $lat, 'longitude' => $lon,
            'current' => 'temperature_2m,weather_code',
        ]);
        $data = $resp->json();
        return [
            'temp_c' => $data['current']['temperature_2m'] ?? null,
            'city' => config('services.weather.city'),
            'condition_code' => $data['current']['weather_code'] ?? null,
        ];
    });
}
```
> Using **Open-Meteo** (free, no key) instead of OpenWeatherMap removes one secret from the whole system — recommended default. Keep the `WEATHER_API_KEY` env var as an optional override if the client later wants OpenWeatherMap's richer icon set.

### [x] Task 4.5 — `SettingController@index` and `AnnouncementController@index`
Straightforward key/value and active-list reads — same pattern as above, cached for 5 minutes since they change rarely.

### [x] Task 4.6 — Image uploads to Supabase Storage
1. In Supabase Studio → Storage, create a public bucket named `event-images`.
2. In `EventController@store/update`, when an image file is present, stream it to Supabase's Storage REST endpoint using Guzzle and the publishable key, then save the returned public URL into `image_url`:
```php
$response = Http::withHeaders([
    'Authorization' => 'Bearer ' . config('services.supabase.key'),
])->attach('file', file_get_contents($request->file('image')->path()), $filename)
  ->post(config('services.supabase.url') . "/storage/v1/object/event-images/{$filename}");

$imageUrl = config('services.supabase.url') . "/storage/v1/object/public/event-images/{$filename}";
```
3. Add `services.supabase.url` / `services.supabase.key` to `backend/config/services.php`, reading from env.

### [x] Task 4.7 — CORS
In `backend/config/cors.php`, allow the frontend origin:
```php
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
'supports_credentials' => true,
```

**Definition of Done for Section 4:** `php artisan serve` runs on port 8000; hitting `GET /api/events`, `/api/metrics`, `/api/announcements`, `/api/settings`, `/api/weather`, `/api/clock` in Postman/curl returns seeded JSON with no errors.

---

## 5. React Frontend — TV Display

### [x] Task 5.1 — Global layout lock for 1080×1920 portrait
In `frontend/src/index.css`, set the app to always render at a fixed portrait canvas that scales to fit any actual screen (important since dev browser ≠ TV panel):
```css
:root {
  --design-width: 1080;
  --design-height: 1920;
}
html, body, #root { height: 100%; margin: 0; overflow: hidden; background: #0b1220; }

.tv-canvas {
  width: 1080px;
  height: 1920px;
  transform-origin: top left;
  position: absolute;
  top: 0; left: 0;
}
```
In `App.jsx`, compute a scale factor on mount/resize (`Math.min(window.innerWidth/1080, window.innerHeight/1920)`) and apply `transform: scale(...)` plus centering — this guarantees the layout is pixel-identical to the design on any physical TV resolution, then the OS/TV just letterboxes or the browser is launched with `--kiosk --window-size=1080,1920`.

### [x] Task 5.2 — Component tree
```
src/
├── App.jsx
├── api/client.js               # axios instance, baseURL from VITE_API_BASE_URL
├── hooks/
│   ├── usePolling.js            # generic "fetch + refetch every N ms" hook
│   └── useClock.js              # local ticking clock, resynced from /api/clock every 5 min
├── components/
│   ├── Header.jsx                # Title + subtitle + collapse icon
│   ├── SidebarNav.jsx             # left icon rail
│   ├── AnnouncementBanner.jsx     # gradient blue banner, rotates every 8s if >1 active
│   ├── StatsGrid.jsx              # 3+3 metric cards
│   │   ├── StatCard.jsx
│   │   ├── WeatherCard.jsx
│   │   └── ClockCard.jsx
│   ├── EventsSection.jsx          # heading + "View All Events" + grid
│   │   └── EventCard.jsx
│   └── Footer.jsx
└── assets/icons/...
```

### [x] Task 5.3 — Polling strategy (kiosk must self-heal, never needs a human to refresh)
```js
// hooks/usePolling.js
export function usePolling(fetcher, intervalMs) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetcher();
        if (!cancelled) { setData(res); setError(null); }
      } catch (e) {
        if (!cancelled) setError(e);
        // keep last good data on screen instead of blanking the TV
      }
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [intervalMs]);
  return { data, error };
}
```
Use this for: events (60s), metrics (60s), announcements (5min), weather (15min), settings (15min). Clock ticks locally every second via `useClock`.

### [x] Task 5.4 — Build each section to match the mockup exactly
- **Header.jsx**: "Knowles Connect" in large blue bold text, subtitle line in gray, circular light-blue button with double-chevron icon top-right (this can later toggle a settings/admin overlay).
- **AnnouncementBanner.jsx**: full-width rounded rectangle, blue gradient (`linear-gradient(135deg,#1d4ed8,#3b82f6)`), white megaphone icon in a translucent circle on the left, message text wraps to 2 lines.
- **SidebarNav.jsx**: fixed vertical rail, icons stacked with generous spacing — hamburger, grid (active/highlighted in solid blue rounded square), people, gift, user, people, megaphone, shield, bell, building. Icons from `lucide-react` (`Menu, LayoutGrid, Users, Gift, User, Users2, Megaphone, ShieldCheck, Bell, Building2`).
- **StatCard.jsx**: white rounded card, small icon badge top-left, uppercase gray label, large bold blue value.
- **WeatherCard.jsx**: same card style, weather icon, temperature large, "Current Weather" label, city name below.
- **ClockCard.jsx**: clock icon, `HH:MM:SS AM/PM` ticking every second via `useClock`, full weekday + date below.
- **EventsSection.jsx**: section header row with calendar icon badge + "Upcoming Events" title, right-aligned "View All Events →" link; below it a responsive 2-column grid of `EventCard`.
- **EventCard.jsx**: rounded card, top ~55% is the event image (`object-fit: cover`), overlapping date badge (white rounded box, blue "JUN" + big "02" + "MON") pinned top-left of the image, time + location row with icons, bold title, 1–2 line gray description truncated with ellipsis.
- **Footer.jsx**: light card, people icon + two-line message on the left, "knowles / Life above all™" logo lockup on the right.

### [x] Task 5.5 — Since a TV can't show unlimited events, add auto-rotation
If more than 6 published events exist, `EventsSection` should paginate through them 6-at-a-time, advancing every 20–30 seconds (configurable via a `settings` key `events_rotation_seconds`), so the "Upcoming Events" metric and the visible grid can stay in sync with the full dataset without needing a "View All Events" click (which is disabled/hidden in kiosk mode, but kept functional for the admin/preview view).

**Definition of Done for Section 5:** `npm run dev`, open `http://localhost:5173`, layout visually matches the reference image at 1080×1920, all data is live from the Laravel API (not mocked), and killing/restarting the backend doesn't crash the frontend (it just keeps last-known-good data and recovers automatically once the API returns).

---

## 6. Admin Panel (Phase 2 — scaffold now, build out after Phase 1 ships)

- Route: `frontend` gets a second entry (`/admin`) using `react-router-dom`, guarded by a login screen calling `POST /api/auth/login` (Sanctum).
- CRUD screens for Events, Metrics, Announcements, Settings — simple tables + forms, reusing the same axios client with the bearer token attached.
- This keeps kiosk display and admin management inside one deployable frontend but two routes, so only one Vite app needs to be built and hosted.

---

## 7. Kiosk Deployment on the Interactive TV

1. **Build**: `cd frontend && npm run build` → static files in `frontend/dist`.
2. **Serve**: host `dist/` via the Laravel backend as a catch-all view, or via a lightweight static server (nginx/Caddy) on the same box as Laravel — recommended: nginx serving `dist/` on `/` and reverse-proxying `/api` to `php artisan serve`/PHP-FPM.
3. **TV browser launch flags** (Chrome/Chromium on the device driving the panel):
   ```bash
   chromium --kiosk --window-size=1080,1920 --window-position=0,0 \
     --noerrdialogs --disable-infobars --autoplay-policy=no-user-gesture-required \
     http://localhost/
   ```
4. **Auto-restart**: run the browser under a `systemd` service (or Windows Task Scheduler if it's a Windows-based panel PC) with `Restart=always`, so a crash or power blip self-recovers without a technician visiting the display.
5. **Screen orientation**: if the physical panel is a landscape 1920×1080 display physically rotated 90°, set the OS display rotation to portrait (`xrandr --output <output> --rotate left` on Linux) rather than trying to rotate inside CSS — this keeps touch input (if any) aligned too.

---

## 8. Environment Variable Reference (final checklist)

**`backend/.env`**
```env
DB_CONNECTION=pgsql
DB_HOST=db.tugkybqqqembvqingyzr.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=<rotate-then-paste-new-password-here>
DB_SSLMODE=require
SUPABASE_URL=https://tugkybqqqembvqingyzr.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_olwJdELypgad5X6AbdAKpw_pJc7vTkQ
FRONTEND_URL=http://localhost:5173
```

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_REFRESH_INTERVAL_MS=60000
```

---

## 9. Build Order Summary (what Copilot Agent should do, in order)

1. Section 2 — scaffold repo, Laravel, React, `.gitignore`, `.env` files.
2. Section 3 — migrations + seeders, run `php artisan migrate --seed`, verify in Supabase Studio.
3. Section 4 — API controllers/routes, verify every endpoint with curl/Postman.
4. Section 5 — React components wired to live API data, pixel-match the reference mockup at 1080×1920.
5. Commit and push to `main` (or a `dev` branch + PR) on `https://github.com/vinzelianne2020-netizen/Interactive-TV.git`, confirming `.env` files are **not** in the commit (`git status` should not list them).
6. Section 6 — admin CRUD (can ship after initial demo of the public display).
7. Section 7 — kiosk deployment flags/service on the actual TV hardware.

---

## 10. Post-Build Security Checklist

- [ ] Rotated the Supabase DB password from the one shared during planning.
- [x] Confirmed `backend/.env` and `frontend/.env` are listed in `.gitignore` and not present in `git log`.
- [x] Confirmed only the Supabase **publishable** key is used anywhere (never a `service_role` secret key) since image upload goes through Laravel, not the browser.
- [x] Admin routes require Sanctum auth; public display routes are read-only.
- [x] CORS restricted to the known frontend origin(s), not `*`.
