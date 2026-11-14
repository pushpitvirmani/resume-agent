---
phase: 3
plan: 1
wave: 1
depends_on: []
files_modified:
  - server/src/services/tailor.ts
  - server/src/routes/tailor.ts
  - server/src/index.ts
  - server/tests/tailor.test.ts
autonomous: true
gap_closure: false

must_haves:
  truths:
    - "AI tailoring engine accepts a job description and master resume, generating tailored bullets with bold hooks and matched keywords"
    - "Active rules from ResumeGuideline table are injected into Gemini system instructions and strictly applied"
    - "ATS scoring algorithm computes realistic score (0-100), matched keywords, and missing keywords"
    - "Interactive feedback refinement endpoint updates tailored resume and generates generalizable guideline candidate"
    - "Automated test in server/tests/tailor.test.ts verifies tailoring, refinement, and rule candidate generation with zero errors"
  artifacts:
    - "server/src/services/tailor.ts"
    - "server/src/routes/tailor.ts"
    - "server/tests/tailor.test.ts"
---

# Plan 3.1: Backend AI Tailoring Engine, ATS Scoring & REST API

## Objective
Implement the core resume tailoring service using the Gemini API client (`gemini-flash-latest`), integrating active guidelines from `ResumeGuideline`, computing ATS keyword match metrics, and building REST endpoints for tailoring generation, direct editing, and interactive feedback refinement with guideline proposal.

## Context
- .gsd/SPEC.md
- .gsd/phases/3/RESEARCH.md
- server/src/services/ai.ts
- server/prisma/schema.prisma
- server/src/db.ts

## Tasks

<task type="auto">
  <name>Build AI Tailoring Service and ATS Scoring Engine</name>
  <files>
    server/src/services/tailor.ts
  </files>
  <action>
    Create `server/src/services/tailor.ts`:
    1. Implement `generateTailoredResume({ jobId, masterResumeId? })`:
       - Fetch `Job`, `MasterResume`, and all active `ResumeGuideline` records from SQLite.
       - Construct system prompt emphasizing:
         - Factual honesty: Do not invent past achievements, metrics, or roles.
         - Target alignment: Align terminology with the target JD.
         - Harshit Style Guide: Start each bullet with a bold lead-in hook (`**Hook:**`).
         - Mandatory active guidelines adherence.
       - Query Gemini via `callAI({ prompt, systemInstruction, responseFormat: 'json' })`.
       - Compute ATS score and keyword analysis (`matchedKeywords`, `missingKeywords`, `score`).
       - Upsert or create record in `TailoredResume` table in SQLite.
       - Return formatted tailored profile and ATS metrics.
    2. Implement `refineTailoredResume({ tailoredResumeId, feedback, section?, bulletIndex? })`:
       - Retrieve existing `TailoredResume` and target `Job`.
       - Query Gemini to adjust the specified section/bullet based on user feedback.
       - Query Gemini to evaluate if the feedback represents a generalizable rule:
         - Return `{ updatedContent, suggestedGuideline?: { rule, category, reasoning } }`.
         - NOTE: DO NOT write `suggestedGuideline` to database automatically — wait for user confirmation.
  </action>
  <verify>
    npx --prefix server tsx -e "import { generateTailoredResume } from './src/services/tailor.js'; console.log('Tailor service exported')"
  </verify>
  <done>
    `generateTailoredResume` and `refineTailoredResume` functions exported and ready for REST endpoints.
  </done>
</task>

<task type="auto">
  <name>Implement Tailoring REST API Router</name>
  <files>
    server/src/routes/tailor.ts
    server/src/index.ts
  </files>
  <action>
    1. Create `server/src/routes/tailor.ts`:
       - `POST /api/tailor`: Generate tailored resume for `jobId`.
       - `GET /api/tailor/:id`: Fetch tailored resume by ID.
       - `GET /api/tailor/job/:jobId`: Fetch existing tailored resume for a specific job.
       - `PUT /api/tailor/:id`: Save manual in-place edits to tailored resume content.
       - `POST /api/tailor/:id/refine`: Submit interactive feedback, receive updated resume and candidate guideline.
    2. Mount `tailorRouter` at `/api/tailor` in `server/src/index.ts`.
  </action>
  <verify>
    npm --prefix server test
  </verify>
  <done>
    All tailoring REST endpoints active and mounted.
  </done>
</task>

<task type="auto">
  <name>Create Automated Test Suite for Tailoring Pipeline</name>
  <files>
    server/tests/tailor.test.ts
    server/package.json
  </files>
  <action>
    1. Create `server/tests/tailor.test.ts`:
       - Test full tailoring pipeline using a sample PM job and master resume.
       - Verify ATS score is a valid percentage (0-100) and matched keywords are populated.
       - Verify tailored bullets lead with bold hooks (`**...**`).
       - Test refinement endpoint with feedback and verify `suggestedGuideline` candidate is generated without auto-persisting to DB.
    2. Add `"test:tailor": "tsx tests/tailor.test.ts --test-run"` in `server/package.json`.
  </action>
  <verify>
    npm --prefix server run test:tailor
  </verify>
  <done>
    `npm --prefix server run test:tailor` passes with exit code 0.
  </done>
</task>

</tasks>

## Must-Haves
- [ ] Tailor service calls Gemini and generates structured tailored profile
- [ ] Bullets follow Harshit format with bold impact hooks
- [ ] ATS score and keyword analysis returned
- [ ] Rule suggestion returned on refinement without auto-saving
- [ ] Automated tests pass cleanly
