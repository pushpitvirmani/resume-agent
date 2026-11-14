# DECISIONS.md — Architecture Decision Records

> **Purpose**: Log significant technical decisions and their rationale.

---

## Decisions

### [DECISION-001] Local Personal Web App Architecture
**Date**: 2026-11-14  
**Status**: Accepted  
- **Context**: The user requires a resume builder, LinkedIn job scraper, and resume customizer for personal use.
- **Decision**: Build as a local single-user web application (Express TypeScript backend + Vite React Tailwind UI + SQLite via Prisma) running locally.
- **Rationale**: Direct access to local browser sessions, maximum privacy for sensitive career history, and zero hosting overhead.

---

### [DECISION-002] Direct PDF/DOCX Master Resume Upload & Parsing
**Date**: 2026-11-14  
**Status**: Accepted  
- **Context**: The user already has master resumes in PDF and Word formats and needs effortless ingestion.
- **Decision**: Provide automated file upload parsing (`pdf-parse` and `mammoth`) with an LLM extraction pipeline that normalizes raw resume files into structured JSON fields (sections, roles, bullet points, metrics, skills) editable in the dashboard.
- **Rationale**: Eliminates tedious manual copy-pasting while retaining 100% editable control.

---

### [DECISION-003] LinkedIn Session Auth via Local Chrome Profile / Cookies
**Date**: 2026-11-14  
**Status**: Accepted  
- **Context**: LinkedIn employs aggressive bot and CAPTCHA detection against automated logins.
- **Decision**: Use existing local Chrome user session cookies in Playwright headless execution.
- **Rationale**: Zero password leakage risk and drastically minimizes bot triggers and CAPTCHAs.

---

### [DECISION-004] Targeted Bullet Rewriting & Metric Preservation
**Date**: 2026-11-14  
**Status**: Accepted  
- **Context**: AI resumes often hallucinate or sound generic when completely rewritten from scratch.
- **Decision**: Gemini will perform targeted bullet rewrites and keyword alignment, strictly preserving authentic quantitative achievements and metrics while tuning terminology to the target JD.
- **Rationale**: Maintains credibility for top-tier FAANG/AI startup screenings.

---

### [DECISION-005] Hybrid Review UI: Visual Diff + AI Prompt Widget + Direct Edit
**Date**: 2026-11-14  
**Status**: Accepted  
- **Context**: Users need fast iteration on tailored resumes before generating final files.
- **Decision**: Implement a side-by-side visual diff showing original vs tailored text, combined with an interactive AI refinement chat/prompt bar AND direct in-place editable text fields.
- **Rationale**: Gives maximum speed and fine-grained control before approval.

---

### [DECISION-006] Vector PDF (Headless Print) & Native DOCX Generation
**Date**: 2026-11-14  
**Status**: Accepted  
- **Context**: Resumes must maintain pixel-perfect styling in UI previews and parse flawlessly in ATS systems.
- **Decision**: Render ATS templates via CSS/HTML to vector PDF via headless Chrome print, and generate native structured Word files using `docx-js`.
- **Rationale**: Standard typography, 100% text selectable, no layout shifts, 100% ATS parseable.

---

### [DECISION-007] 3-Part ATS Scoring Breakdown
**Date**: 2026-11-14  
**Status**: Accepted  
- **Context**: Users need actionable feedback on why a resume scores high or low for a given JD.
- **Decision**: Provide an overall percentage match score, a keyword density table (Matched vs Missing skills), and a bullet impact rating (quantified metrics & action verbs).
- **Rationale**: Gives immediate guidance on what to improve before submitting.

---

### [DECISION-008] Web App Panel Navigation & Information Architecture
**Date**: 2026-11-14  
**Status**: Accepted  
- **Context**: The web application controls scraping, job review, resume editing, diff review, and ATS templates across multiple complex features.
- **Decision**: Implement a 5-section sidebar layout:
  1. **Overview Dashboard**: Key metrics (New Jobs, Tailored Count, Avg ATS Score, Next Run), instant "Scrape Now" trigger, recent matches, and Master Resume status.
  2. **LinkedIn Job Feed**: Targeted keyword search bar (preventing random scrapes), filter pills (titles, location, remote, date), split-view table with JD reader drawer, and floating "Tailor Selected (N) Resumes" action bar.
  3. **Tailor & Review Studio**: 3-column workspace with job tabs: Left column has JD & extracted ATS keywords; Center has side-by-side visual diff with direct editable text; Right column has conversational AI feedback chat + template selector + Export PDF/DOCX buttons.
  4. **Resume Builder & Template Studio**: Dual-pane studio: Left pane with template selector gallery (FAANG Modern, Harvard Classic, AI Startup Minimalist, Wharton Tech) + collapsible section editors with metric badges; Right pane with live vector document preview + ATS gauge + Export buttons.
  5. **Settings Center**: LinkedIn Session & Cookie manager, Scraper scheduler & limits, and Multi-model AI Engine selector.
- **Rationale**: Clean, modular workflow preventing information overload and matching professional recruitment workflows.

---

### [DECISION-009] Multi-Model AI Engine (Gemini, Claude, GPT)
**Date**: 2026-11-14  
**Status**: Accepted  
- **Context**: The user requested model flexibility with options for Claude, GPT, and Gemini.
- **Decision**: Implement an AI provider abstraction layer supporting Google Gemini (`gemini-2.5-flash`), Anthropic Claude (`claude-3-5-sonnet`), and OpenAI GPT (`gpt-4o`/`gpt-4o-mini`) configurable in the Settings panel with individual API key fields and latency tests. Default provider is Gemini.
- **Rationale**: Prevents vendor lock-in and complies with GSD Model Independence Rule.

---

### [DECISION-010] Learned Resume Guidelines with Explicit User Confirmation
**Date**: 2026-11-14  
**Status**: Accepted  
- **Context**: The user wants feedback given during resume editing in the admin panel to accumulate into general rule guidelines applied across all future resumes, but requires explicit confirmation before any new rule is added.
- **Decision**: 
  1. Create a `ResumeGuideline` model in SQLite storing confirmed rules (e.g. "Always quantify PM metrics with revenue or user growth numbers", "Never use passive voice", "Keep bullets under 2 lines").
  2. When the user submits feedback in the AI refinement chat, the AI detects if the feedback implies a reusable general rule.
  3. The UI presents an explicit confirmation prompt: *"Add as a global guideline for all future resumes: '{rule}'? [Confirm] [Dismiss]"*.
  4. Once confirmed, the rule is saved and automatically injected into all subsequent resume tailoring prompts for any job.
  5. The Settings panel includes a "Global Resume Guidelines" manager to view, toggle, or delete confirmed rules.
- **Rationale**: Allows the app to learn and adapt to the user's personal taste over time without accidental or unconfirmed rule creep.

---

*Last updated: 2026-11-14*
