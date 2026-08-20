# Knowles Connect — Full CRUD & Live-Sync Implementation Plan
**Goal:** Make every admin nav module (Events, Metrics, Announcements, Settings) fully functional for Create, Read, Update, Delete, and File Upload — with changes reflecting automatically on the public landing page / TV display without manual refresh.

---

## 1. Current State Audit

Based on the live admin panel already reviewed:

| Module | Endpoint base | Fields | Upload? | Status |
|---|---|---|---|---|
| Events | `/admin/events` | title, description, event_date, event_time, location, category, is_published, sort_order, image | ✅ banner image | UI built, needs full CRUD verification |
| Metrics | `/admin/metrics` | key, label, value, icon | ❌ | UI built, needs full CRUD verification |
| Announcements | `/admin/announcements` | message, is_active, sort_order | ❌ | UI built, needs full CRUD verification |
| Settings | `/admin/settings/{key}` | key, value | ✅ activity calendar file (JPG/PNG/WebP/PDF) | UI built, needs full CRUD verification |

Frontend already has:
- `client.js` (axios instance, `withCredentials: true`, CSRF-aware)
- `AdminPanel.jsx` (handles all 4 sections in one component via `SECTION_DEFS`)
- `hooks/usePolling.js` — **this is the key to auto-reflecting changes** on the public display
- `hooks/useClock.js`

This plan assumes the auth/session/CORS issues from the earlier fix (`SANCTUM_STATEFUL_DOMAINS`, `SESSION_SAME_SITE=none`, `SESSION_SECURE_COOKIE=true`, CORS `paths`) are already resolved and login is stable.

---

## 2. Success Criteria ("Fully Functional")

For every module (Events, Metrics, Announcements, Settings):

1. **Create** — new record saves, appears immediately in the admin list, and appears on the public display within one polling cycle.
2. **Read** — admin list and public display always show current backend data, not stale/cached data.
3. **Update** — editing an existing record saves, list updates in place, public display reflects the change automatically.
4. **Delete** — record is removed from admin list and disappears from the public display automatically.
5. **File Upload** (Events banner, Settings activity calendar) — file uploads, preview renders, old file is replaced/cleaned up, and the new file renders correctly on the public display.
6. **No manual refresh required** on the public TV display — changes appear via polling (or, in Phase 4, WebSockets) within a defined SLA (e.g., ≤15–30 seconds).
7. **Validation & error handling** — every form shows field-level errors from Laravel (`422` responses), and network/session errors are handled gracefully (no silent failures, no broken UI state).

---

## 3. Backend Plan (Laravel)

### 3.1 Route Audit

Confirm/define these routes in `routes/api.php`, all under `auth:sanctum` + `admin` middleware (except the public read endpoints):

```php
// --- Admin (protected) ---
Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    Route::apiResource('events', EventController::class);
    Route::apiResource('metrics', MetricController::class);
    Route::apiResource('announcements', AnnouncementController::class);
    Route::get('settings', SettingController::class . '@index');
    Route::put('settings/{key}', SettingController::class . '@update');
    Route::post('activity-calendar', SettingController::class . '@uploadCalendar');
});

// --- Public (read-only, no auth) — consumed by the TV display ---
Route::prefix('public')->group(function () {
    Route::get('events', PublicDisplayController::class . '@events');
    Route::get('metrics', PublicDisplayController::class . '@metrics');
    Route::get('announcements', PublicDisplayController::class . '@announcements');
    Route::get('settings', PublicDisplayController::class . '@settings');
    Route::get('bootstrap', PublicDisplayController::class . '@bootstrap'); // combined payload, 1 call
});
```

**Why a separate `/public/*` set of endpoints:** the TV display should never need to authenticate or carry admin session cookies — it's a kiosk with no login. A single `bootstrap` endpoint that returns events + metrics + announcements + settings in one JSON payload reduces the number of polling requests and keeps the display resilient if one of the underlying tables errors out.

### 3.2 Controllers — CRUD Checklist (apply to Event, Metric, Announcement controllers)

- [ ] `index()` — returns paginated/sorted list (respect `sort_order` where applicable)
- [ ] `store()` — validates via **Form Request** class (`StoreEventRequest`, etc.), returns `201` + created resource
- [ ] `show()` — single record (optional, admin panel currently works off `index`)
- [ ] `update()` — validates via **Form Request**, supports `PUT` and the `POST + _method=PUT` pattern already used in `AdminPanel.jsx` for multipart image uploads
- [ ] `destroy()` — deletes record, **and deletes the associated uploaded file from storage** (Events banner), returns `204`
- [ ] All responses wrapped consistently: `{ "data": ... }` for success, `{ "message": ..., "errors": {...} }` for `422` validation failures (already expected by the frontend's `buildValidationSummary`)

### 3.3 File Upload Handling

**Events banner image & Settings activity calendar:**

- [ ] Store uploaded files on Laravel's `public` disk (`storage/app/public/...`), not `local`
- [ ] Run `php artisan storage:link` on deploy (symlinks `public/storage` → `storage/app/public`) — **verify this exists on the Render build command**, since a missing symlink is a common cause of "uploaded but image doesn't show" bugs
- [ ] Validate file type/size server-side (don't rely on the `accept` attribute alone):
  ```php
  'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120', // 5MB
  'calendar' => 'nullable|mimes:jpg,jpeg,png,webp,pdf|max:10240', // 10MB
  ```
- [ ] On update/replace, **delete the old file** before/after storing the new one to avoid orphaned files filling up disk
- [ ] Return the full public URL in the API response (`image_url`), not just the storage path, so the frontend `<img src={draft.image_url}>` works with zero extra logic

### 3.4 Settings — Special Handling

Settings are key/value pairs, not a numeric-ID resource. Confirm:
- [ ] `update()` upserts (creates the key if it doesn't exist yet, updates if it does) — since `AdminPanel.jsx` always calls `PUT /admin/settings/{key}`
- [ ] Reserved/system keys (like the activity calendar path) aren't editable through the generic key/value form if they're meant to be managed only via the upload button — add a small `is_protected` flag or a naming convention (`_activity_calendar_path`) so the generic settings list doesn't let someone accidentally overwrite the calendar path with garbage text

### 3.5 Response Caching (important for the "auto-reflect" requirement)

- [ ] If Laravel response caching or `Cache::remember()` is used anywhere on the public endpoints, **bust the cache in the controller's `store`/`update`/`destroy` methods** for that resource. Stale cache is the #1 cause of "I updated it but the TV still shows the old thing."
- [ ] Set explicit no-cache headers on `/public/*` responses, or a short `max-age` (e.g. 5–10s) if using HTTP caching, so browsers/CDNs on the display device don't hold old data longer than the polling interval anyway.

---

## 4. Frontend Plan — Admin Panel (React)

Most of the UI already exists in `AdminPanel.jsx`. Focus is on **verifying and hardening**, not rebuilding:

### 4.1 Per-Module Checklist

- [ ] **Create flow**: `handleCreateNew()` → empty draft → `handleSaveRecord()` with `selectedRecordId === null` → confirm it POSTs (not PUTs) and the new record appears in `filteredRecords` after `loadWorkspace()` re-runs
- [ ] **Edit flow**: `handleSelectRecord()` → populates `draft` via `buildDraftFromRecord()` → `handleSaveRecord()` with `selectedRecordId` set → confirm it PUTs to the right ID
- [ ] **Delete flow**: confirm the two-step "Delete → Confirm" UI (`confirmDeleteId`) correctly calls `handleDeleteRecord()` and the record disappears from the list without needing a manual refresh
- [ ] **Image/file upload**: confirm `imageFile` state clears after a successful save, and `imagePreviewUrl` correctly shows either the new local preview or the saved `image_url` from the server
- [ ] **Validation display**: trigger a deliberate validation error (e.g. empty required title) and confirm `formFieldErrors` renders under the right field, not just as a generic toast

### 4.2 Error & Session Handling

- [ ] Every mutation (`handleSaveRecord`, `handleDeleteRecord`, `handleActivityCalendarUpload`) already catches `401/403` and forces re-login — confirm this actually triggers the login screen and doesn't leave the UI in a broken "loading forever" state
- [ ] Add a lightweight **optimistic UI update** (optional but recommended): after a successful save/delete, update `workspace` state directly instead of waiting for the full `loadWorkspace()` round-trip, so the admin sees the change instantly while the background refetch confirms it

### 4.3 UX Polish for CRUD Confidence

- [ ] Disable the Save button while `loadingAction` is true (already partially done — verify it's applied consistently across all 4 forms)
- [ ] Add a toast/snackbar pattern consistent across create/update/delete/upload (currently `saveMessage`/`saveError` — good foundation, just confirm it fires for every action type including delete and calendar upload)
- [ ] Confirm the "Reset Form" button truly clears file inputs (`imageFile`, `activityCalendarFile`) — file inputs are notoriously tricky to reset programmatically in React; may need a `key` prop reset trick if not already handled

---

## 5. The "Auto-Reflect on Landing Page" Mechanism

This is the core new requirement. Two viable approaches — **recommend starting with Phase A (Polling), upgrade to Phase B (WebSockets) only if the 15–30s delay proves unacceptable.**

### Phase A — Smart Polling (fast to ship, uses the existing `usePolling.js` hook)

1. **Public display fetches from `/public/bootstrap`** (the combined endpoint from 3.1) on an interval — recommend **15 seconds** as a starting point (balances "feels live" vs. unnecessary server load on Render's free tier).
2. **`usePolling.js`** should:
   - [ ] Support a configurable interval
   - [ ] Pause polling when the browser tab/kiosk is not visible (`document.visibilityState`) to save requests — not critical for a dedicated kiosk, but good practice
   - [ ] Diff the new payload against the last one before re-rendering (avoid unnecessary re-renders/flicker if nothing changed) — compare a lightweight hash or `updated_at` timestamp per section rather than deep-diffing every field
3. **Backend returns an `updated_at`/version marker** per section in the bootstrap payload, so the frontend can skip re-render work when nothing changed:
   ```json
   {
     "events": { "updated_at": "...", "data": [...] },
     "metrics": { "updated_at": "...", "data": [...] },
     "announcements": { "updated_at": "...", "data": [...] },
     "settings": { "updated_at": "...", "data": {...} }
   }
   ```
4. **Loading/transition states on the display**: when new data arrives, fade/transition rather than hard-flash the screen — matters a lot for a public-facing kiosk.

### Phase B — Real-Time Push (upgrade path, not required for v1)

If 15–30 second polling delay isn't fast enough later:
- Add **Laravel Broadcasting** (Reverb, or Pusher-compatible) + **Laravel Echo** on the display frontend.
- Fire a broadcast event (`EventUpdated`, `AnnouncementUpdated`, etc.) from each controller's `store`/`update`/`destroy` method.
- Display subscribes to a public channel and updates instantly instead of waiting for the next poll.
- **Trade-off:** more moving parts (a broadcasting server/service, possibly a paid add-on depending on host), so only worth it if near-instant sync becomes a hard requirement.

**Recommendation: ship Phase A first.** It requires zero new infrastructure, reuses the hook that's already in the codebase, and 15 seconds is imperceptible for a workplace bulletin board use case.

---

## 6. QA / Test Matrix

Run this full matrix once implementation is done, for **each of the 4 modules**:

| Action | Admin Panel Behavior | Public Display Behavior (within polling interval) |
|---|---|---|
| Create new record | Appears in list, form resets | Appears on display |
| Edit existing record | List item updates, form shows saved values | Display updates in place |
| Delete record | Removed from list immediately | Disappears from display |
| Upload/replace image or file | Preview updates, old file replaced | New file renders correctly |
| Toggle publish/active switch | Switch state persists on reload | Item appears/disappears from display accordingly |
| Invalid input (empty required field) | Field-level error shown, no save | No change (nothing should have saved) |
| Session expires mid-edit | Graceful "please sign in again" message, no data loss if possible | N/A |
| Two admins editing simultaneously | Last write wins — acceptable for v1; document this as a known limitation | N/A |

---

## 7. Implementation Roadmap

**Phase 1 — Backend Hardening (Week 1)**
- Audit/complete all 4 controllers against the CRUD checklist (Section 3.2)
- Add Form Request validation classes
- Fix file storage (`storage:link`, old-file cleanup, public URL responses)
- Build the `/public/bootstrap` endpoint with `updated_at` markers
- Add cache-busting on every mutation

**Phase 2 — Frontend CRUD Verification (Week 1–2)**
- Manually test create/edit/delete/upload on all 4 modules per Section 6's matrix
- Fix any broken flows found
- Add optimistic UI updates and consistent toast feedback

**Phase 3 — Public Display Live-Sync (Week 2)**
- Point the public TV display at `/public/bootstrap`
- Implement/upgrade `usePolling.js` with visibility-aware polling + diffing
- Add smooth transition animations for content changes
- Load-test the polling interval against Render free-tier limits (watch for cold-start delays if the backend spins down from inactivity — consider a lightweight keep-alive ping if this becomes an issue)

**Phase 4 — Full QA Pass (Week 2–3)**
- Run the full test matrix (Section 6) end-to-end
- Test on the actual kiosk hardware/display, not just a browser window
- Confirm no manual refresh is ever required during a full day of simulated admin activity

**Phase 5 — (Optional) Real-Time Upgrade**
- Only pursue if Phase A's polling delay is genuinely a problem in practice
- Implement Laravel Broadcasting + Echo per Section 5, Phase B

---

## 8. Open Questions to Confirm Before Building

1. Is the Render **free tier** being used for the backend? If so, cold-start spin-down could cause the *first* poll after idle time to be slow (several seconds) — worth knowing upfront so it's not mistaken for a sync bug later.
2. What's the acceptable "feels live" delay for the business — is 15 seconds fine, or does leadership expect truly instant updates (which would justify jumping straight to Phase B)?
3. Should deleted Events/Announcements be **soft-deleted** (kept in DB, hidden from display) instead of hard-deleted — useful for an audit trail, matches the "Enterprise Security & Activity Auditing" messaging already in the UI footer.
4. File size/type limits for uploads — confirmed values above (5MB image, 10MB calendar) are reasonable defaults but should be confirmed against what the actual admin content team will be uploading.
