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

*Last updated: 2026-11-14*
