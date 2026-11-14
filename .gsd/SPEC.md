# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
A personal local web application that automates the daily search for relevant Product Management jobs on LinkedIn, empowers targeted one-click resume customization tailored to individual job descriptions with high ATS scoring for top tech (FAANG/AI startups), provides side-by-side visual diffs and interactive AI feedback adjustment, and exports verified ATS-optimized resumes in both PDF and DOCX formats.

## Goals
1. **Daily LinkedIn PM Job Scraper**: Headless scraping service on a configurable schedule to collect PM roles matching domain filters into a unified local job dashboard.
2. **Dashboard & Job Feed Control Center**: Clean web interface allowing the user to view new jobs, inspect JDs, select single or batch postings, schedule scrapers, and manage application statuses.
3. **AI-Powered Resume Tailoring Engine**: Read JD requirements, compare with a master resume profile, and rewrite bullet points and summary using Gemini API to optimize relevance and ATS keyword density.
4. **Visual Diff & Interactive Feedback Widget**: Render a side-by-side diff comparing the original vs. customized resume, with an interactive chat/prompt widget allowing instant iterative revisions based on user critique before approval.
5. **ATS Resume Builder & FAANG/AI Template Library**: Dedicated resume builder section offering clean, single-column, ATS-parseable templates designed for top product companies and AI startups, with ATS scoring feedback.
6. **Dual-Format Document Exporter**: Generate polished, ATS-compliant `.pdf` and `.docx` files for any tailored or newly built resume.

## Non-Goals (Out of Scope)
- Automated job application dispatch / "Easy Apply" auto-submitting (deferred to post-MVP phase).
- Multi-user authentication, cloud multi-tenancy, or public SaaS hosting (personal single-user local app only).
- Scraping non-LinkedIn platforms (Indeed, Glassdoor, ZipRecruiter) in v1.
- Recruiter cold email / automated LinkedIn messaging outreach.

## Users
- Primary User: The repository owner (a Product Management professional targeting FAANG and top AI startup roles).

## Constraints
- **Platform**: Personal local web application running locally on Windows.
- **AI Provider**: Google Gemini API for NLP, JD parsing, bullet tailoring, and ATS score evaluation.
- **Scraping**: Headless LinkedIn automation with safe rate-limiting and session management.
- **Export Formats**: Must strictly support both `.pdf` and `.docx` exports preserving ATS-friendly layout standards.

## Success Criteria
- [ ] Successfully schedule and execute headless scraping of LinkedIn for PM job postings and display them in the local dashboard.
- [ ] Parse a selected job description and generate tailored bullet points from a master profile using Gemini API.
- [ ] View side-by-side visual diff of original vs. tailored resume in the web UI.
- [ ] Modify the tailored resume via an interactive feedback widget ("make this bullet more metric-focused") with real-time updates.
- [ ] Provide a library of high-scoring ATS templates targeted at FAANG/AI startups.
- [ ] Successfully export tailored resumes to both formatted `.pdf` and clean `.docx` without formatting artifacts.
