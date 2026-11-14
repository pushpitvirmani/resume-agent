# DECISIONS.md — Architecture Decision Records

> **Purpose**: Log significant technical decisions and their rationale.

---

## Decisions

### [DECISION-001] Local Personal Web App Architecture

**Date**: 2026-11-14  
**Status**: Accepted  

#### Context
The user requires a resume builder, LinkedIn job scraper, and resume customizer for personal use.

#### Decision
Build as a local single-user web application (e.g. FastAPI / Node backend + React UI running locally) rather than a cloud-hosted multi-tenant SaaS.

#### Rationale
- Allows seamless headless browser automation using local user profiles without IP-blocking or complex multi-tenant credentials.
- Maximum privacy for sensitive master resume data and personal career history.
- Simpler development, zero hosting overhead.

---

### [DECISION-002] Google Gemini API for NLP and Tailoring

**Date**: 2026-11-14  
**Status**: Accepted  

#### Context
Need an LLM for JD keyword extraction, resume bullet rewriting, conversational feedback tweaking, and ATS scoring.

#### Decision
Use Google Gemini API with structured output prompting.

#### Rationale
- High quality reasoning, fast inference, large context window for detailed JDs and full master resumes, and user's explicitly preferred provider.

---

### [DECISION-003] Deferring LinkedIn Auto-Apply to Post-MVP

**Date**: 2026-11-14  
**Status**: Accepted  

#### Context
Automated application dispatch carries account risk and depends on having perfect tailored resumes first.

#### Decision
Prioritize scraper, dashboard, ATS templates, tailoring engine with diff review, and PDF/DOCX export in v1.0. Treat automated submission as an optional post-MVP milestone.

---

*Last updated: 2026-11-14*
