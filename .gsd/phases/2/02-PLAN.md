---
phase: 2
plan: 2
wave: 2
depends_on:
  - 01-PLAN.md
files_modified:
  - server/package.json
  - server/src/services/scheduler.ts
  - server/src/routes/scraper.ts
  - server/src/index.ts
  - client/src/components/OverviewDashboard.tsx
  - client/src/components/JobsFeedPanel.tsx
autonomous: true
gap_closure: false

must_haves:
  truths:
    - "Scraper trigger endpoint POST /api/scraper/trigger starts scrape job and respects requested or configured settings"
    - "GET /api/scraper/status reports active scraping progress, job count, and last run timestamp"
    - "Cron scheduler service can automatically run scrapes according to AppSettings"
    - "OverviewDashboard and JobsFeedPanel have working Scrape triggers with live progress feedback and automatic job list refresh"
  artifacts:
    - "server/src/services/scheduler.ts"
    - "server/src/routes/scraper.ts"
---

# Plan 2.2: Scraper Scheduler, REST Endpoints & UI Integration

## Objective
Wire the scraper core engine into an on-demand triggerable REST API with real-time status reporting, an optional `node-cron` background scheduler honoring `AppSettings`, and connect the React frontend (`OverviewDashboard.tsx` and `JobsFeedPanel.tsx`) with live scraping feedback, progress pills, and job list auto-refresh.

## Context
- .gsd/phases/2/01-PLAN.md
- server/src/services/scraper.ts
- server/src/routes/settings.ts
- client/src/components/OverviewDashboard.tsx
- client/src/components/JobsFeedPanel.tsx

## Tasks

<task type="auto">
  <name>Install node-cron, Implement Scheduler and Scraper Routes</name>
  <files>
    server/package.json
    server/src/services/scheduler.ts
    server/src/routes/scraper.ts
    server/src/index.ts
  </files>
  <action>
    1. In `server/package.json`, install `node-cron` and `@types/node-cron`.
    2. Create `server/src/services/scheduler.ts`:
       - Manage single running scrape task status: `{ isRunning: boolean; progress: string; currentCount: number; maxJobs: number; lastRunAt: string | null; error: string | null }`.
       - Expose `triggerScrape(options)` and `getScraperStatus()`.
       - Expose `initScheduler()` which reads `AppSettings` and registers a cron task if schedule is enabled.
    3. Create `server/src/routes/scraper.ts`:
       - `POST /api/scraper/trigger`: Accepts optional `{ keywords, location, maxJobs, datePreset, dateFrom }`. If omitted, loads defaults from `AppSettings`. Returns `{ ok: true, message: "Scraping initiated", status }`.
       - `GET /api/scraper/status`: Returns current `{ isRunning, progress, currentCount, maxJobs, lastRunAt, error }`.
       - `POST /api/scraper/cancel`: Cancels in-flight scrape if running.
    4. Register scraper router in `server/src/index.ts` at `/api/scraper` and initialize scheduler on server start (when not in test mode).
  </action>
  <verify>
    npx tsx -e "import './server/src/services/scheduler.js'; console.log('Scheduler module verified')"
  </verify>
  <done>
    Scraper API endpoints active and responding at /api/scraper/status and /api/scraper/trigger.
  </done>
</task>

<task type="auto">
  <name>Connect React Frontend to Scraper API with Real-time Progress</name>
  <files>
    client/src/components/OverviewDashboard.tsx
    client/src/components/JobsFeedPanel.tsx
  </files>
  <action>
    1. In `OverviewDashboard.tsx`:
       - Connect "Scrape Now" button to call `POST /api/scraper/trigger`.
       - Implement status polling while `isRunning` is true, showing a animated spinner/pill with current progress ("Scraping 5/20 jobs...").
       - Upon completion, refresh metrics and recent jobs list automatically.
    2. In `JobsFeedPanel.tsx`:
       - Connect "Scrape LinkedIn" button to send targeted search query (keywords, location) to `POST /api/scraper/trigger`.
       - Display a live progress banner when scraping is in progress.
       - Automatically reload jobs table once scraping finishes.
  </action>
  <verify>
    npm --prefix client run build
  </verify>
  <done>
    Frontend builds cleanly and provides interactive scraping feedback on both dashboard and jobs feed views.
  </done>
</task>

</tasks>

## Must-Haves
- [ ] `POST /api/scraper/trigger` triggers scrape
- [ ] `GET /api/scraper/status` returns progress
- [ ] Scheduler initializes cleanly without crashes
- [ ] UI provides real-time progress indicators and refreshes job list on completion
