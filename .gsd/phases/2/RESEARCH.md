# RESEARCH.md — Phase 2: LinkedIn Scraper Architecture & Strategy

> **Phase:** 2 - LinkedIn Job Scraper Engine & Dashboard Feed  
> **Status:** Completed  
> **Date:** 2026-11-14

---

## 1. Problem Space & Challenges
Scraping LinkedIn jobs presents two classic friction points:
1. **Authentication Gate & Account Safety**: Headless logins using passwords trigger automated CAPTCHAs, email verification codes, and temporary account restrictions.
2. **Dynamic DOM & Rate Limits**: Frequent selector changes and aggressive IP rate-limiting.

---

## 2. Solution: The Two-Tier Resilient Scraper Architecture

### Tier 1: Public Guest Jobs API (Primary, Zero-Ban Risk)
LinkedIn exposes a lightweight, public guest endpoint used for unauthenticated search and crawler indexing:
- **Search Endpoint**:
  ```
  GET https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={keywords}&location={location}&f_TPR={dateFilter}&start={offset}
  ```
  - Query params:
    - `keywords`: e.g. `Senior Product Manager` or `AI Product Manager`
    - `location`: e.g. `Remote` or `India`
    - `f_TPR`: Date filter (`r86400` = 24h, `r604800` = 7 days, `r2592000` = 30 days)
    - `start`: Pagination offset (0, 25, 50...)
- **Individual Job Detail Endpoint**:
  ```
  GET https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{jobId}
  ```
- **Benefits**:
  - Extremely fast and reliable.
  - Zero account risk (no login required, no session cookies required to be passed over the wire).
  - Returns clean semantic HTML containing job title, company name, location, posting date, and full job description.

### Tier 2: Headless Playwright Session (Secondary / Authenticated)
- For advanced scenarios requiring user session cookies:
  - Playwright with Chromium in headless mode.
  - User-Agent spoofing and randomized delays (1.5s – 3.5s) between requests.
  - Cookie injection from local configuration.

---

## 3. Date Filter Mapping

| UI Preset | LinkedIn API Parameter `f_TPR` | Fallback Date Logic |
|---|---|---|
| Past 24 Hours (`past_24h`) | `r86400` | Filter postings < 24h old |
| Past 7 Days (`past_week`) | `r604800` | Filter postings < 7 days old |
| Past 30 Days (`past_month`) | `r2592000` | Filter postings < 30 days old |
| Custom Date (`custom`) | Fetches recent + filters `postedDate >= scrapeDateFrom` | Exact calendar comparison |

---

## 4. Scheduling & Job Execution Model
- **Library**: `node-cron` inside the Express backend server.
- **Trigger**: Reads `AppSettings.dailyScheduleCron` from SQLite (default `0 9 * * *`).
- **On-Demand**: `POST /api/scraper/trigger` endpoint triggers immediate targeted scrape without waiting for the cron timer.
- **Progress Tracking**: Scraper emits status events (e.g. `scraping`, `parsing`, `completed`, `failed`) and updates `lastRunAt` and `lastScrapedCount`.
