---
name: exact-scraper
description: Strict exact-keyword job scraper protocol for LinkedIn and external postings. Enforces zero non-matching job ingestion, single-point manual user triggering, and SQLite persistence.
---

# Exact Keyword Scraper Protocol (P0 Invariant)

## Core Objective
Ensure that job scraping operations **strictly and exclusively** fetch postings containing the target keyword phrase, avoiding broad or loose results returned by search algorithms.

## Non-Negotiable Invariants

1. **Exact Keyword Phrase Matching:**
   - Every candidate posting MUST match the target keyword(s) with word boundary validation (`\b<keyword>\b`).
   - Title matches take top priority (`title.includes(keyword)`).
   - If the title does not contain the keyword phrase, the job description must explicitly state the hiring/role intent (e.g., `"seeking a <keyword>"`, `"role: <keyword>"`).
   - Loose matches (e.g. "Software Engineer" or "Business Developer" when targeting "Product Manager") MUST be discarded immediately before database persistence.

2. **Single-Point Manual Triggering:**
   - Scraping occurs **ONLY** when the user explicitly clicks the **"Scrape Now"** or **"Scrape LinkedIn"** CTA button.
   - Background cron jobs and automated on-mount/startup scraping are strictly disabled.
   - No hidden live scraping requests are permitted during browsing, job selecting, tailoring, or exporting.

3. **Database Persistence & Cross-Page Reusability:**
   - Scraped results are saved to the SQLite database (`Job` table).
   - All frontend views (**LinkedIn Jobs Feed**, **Overview Dashboard**, **Tailor & Review Studio**, **Resume Studio**) read exclusively from the database records via `GET /api/jobs`.
   - Obsolete, non-matching discovered jobs are pruned during targeted runs to prevent pollution of the user's feed.
