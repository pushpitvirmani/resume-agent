# ROADMAP.md

> **Current Phase**: 5 Complete  
> **Milestone**: v1.0 (MVP) — COMPLETE

## Must-Haves (from SPEC)
- [x] Headless scheduled LinkedIn scraper for Product Management roles
- [x] Job management dashboard with schedule triggers and posting selection
- [x] Master resume profile schema and storage
- [x] Gemini API-driven JD analysis, keyword extraction, and bullet customization
- [x] Side-by-side diff viewer with interactive feedback widget for iterative tweaks
- [x] FAANG/AI startup ATS-optimized resume template library (10 top-company templates)
- [x] ATS score evaluation breakdown
- [x] Dual-format export engine (.pdf and .docx)
- [x] Multi-profile isolation with Pushpit Virmani default baseline
- [x] Word-level bolding and 1-page auto-fit diagnostics

## Phases

### Phase 1: Core Foundation & Master Resume Management
**Status**: ✅ Complete  
**Objective**: Set up application scaffold (backend API + frontend dashboard), local data persistence for master resume and jobs, and Gemini API client integration.  
**Requirements**: REQ-03  

### Phase 2: LinkedIn Job Scraper Engine & Dashboard Feed
**Status**: ✅ Complete  
**Objective**: Build the headless LinkedIn job scraper with scheduling capability, error/rate-limit handling, and the dashboard job list view with status tracking.  
**Requirements**: REQ-01, REQ-02  

### Phase 3: Gemini AI Resume Tailoring, Diff Viewer & Interactive Feedback
**Status**: ✅ Complete  
**Objective**: Implement JD extraction, Gemini-powered bullet/summary tailoring, visual side-by-side diff UI, and an interactive feedback widget for on-the-fly revisions.  
**Requirements**: REQ-04, REQ-05, REQ-06  

### Phase 4: ATS Template Studio & Resume Builder
**Status**: ✅ Complete  
**Objective**: Build the standalone resume builder studio with a curated library of 10 FAANG/AI startup ATS templates, word-level formatting, 1-page auto-fit, multi-profile isolation, and ATS keyword/score analyzer.  
**Requirements**: REQ-07, REQ-08  

### Phase 5: Export Engine (PDF & DOCX) & Batch Workflow Integration
**Status**: ✅ Complete  
**Objective**: Implement production-grade PDF and DOCX document generators matching ATS standards, and integrate the full end-to-end flow from job selection to downloaded files.  
**Requirements**: REQ-09, REQ-10  
