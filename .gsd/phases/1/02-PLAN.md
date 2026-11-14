---
phase: 1
plan: 2
wave: 2
depends_on:
  - "01-PLAN.md"
files_modified:
  - server/src/services/gemini.ts
  - server/src/routes/gemini.ts
  - server/src/routes/resume.ts
  - server/src/routes/jobs.ts
  - server/src/index.ts
  - server/tests/api.test.ts
autonomous: true
gap_closure: false
user_setup:
  - service: gemini
    why: "AI resume tailoring, keyword extraction, and ATS scoring"
    env_vars:
      - name: GEMINI_API_KEY
        source: "Google AI Studio (https://aistudio.google.com/app/apikey)"

must_haves:
  truths:
    - "GET /api/gemini/status returns structured connection info without crashing when API key is missing or valid"
    - "GET /api/resume returns the structured master resume profile with parsed arrays for experience and skills"
    - "PUT /api/resume validates payload against schema and updates the database record"
    - "POST /api/resume/upload accepts PDF/DOCX files, parses text, and populates master resume"
    - "POST /api/jobs and GET /api/jobs create and list job postings"
    - "Automated API tests pass, validating all CRUD endpoints"
  artifacts:
    - "server/src/services/gemini.ts"
    - "server/src/routes/gemini.ts"
    - "server/src/routes/resume.ts"
    - "server/src/routes/jobs.ts"
    - "server/tests/api.test.ts"
---

# Plan 1.2: Gemini API Client Integration & Master Resume REST APIs

## Objective
Implement the Gemini API integration wrapper with error resilience and connection health monitoring, alongside RESTful API endpoints for managing the Master Resume profile (retrieve, update with Zod validation, reset to seed, and PDF/DOCX file upload parser) and baseline Job records. Provide an automated test suite verifying data roundtrip and API behavior.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- .gsd/ROADMAP.md
- server/prisma/schema.prisma
- server/src/db.ts
- server/src/types/resume.ts

## Tasks

<task type="auto">
  <name>Implement Gemini API Client Service & Status Endpoint</name>
  <files>
    server/src/services/gemini.ts
    server/src/routes/gemini.ts
    server/src/index.ts
  </files>
  <action>
    Create a resilient Google Gemini API service layer and status check endpoint:
    1. Create `server/src/services/gemini.ts`:
       - Use `@google/genai` (or `@google/generative-ai`) to initialize the client using `process.env.GEMINI_API_KEY`.
       - Implement `checkGeminiConnection(): Promise<{ connected: boolean; model: string; message: string }>`:
         - If `process.env.GEMINI_API_KEY` is undefined or empty string: return `{ connected: false, model: "none", message: "GEMINI_API_KEY is not configured in .env" }`. Do not throw an exception.
         - If key is present: send a minimal ping prompt (`"Hello"`) to model `gemini-2.5-flash` (or fallback `gemini-1.5-flash`). If successful, return `{ connected: true, model: "gemini-2.5-flash", message: "Connected to Gemini API" }`.
         - On API error (invalid key, rate limit, network): catch error and return `{ connected: false, model: "gemini-2.5-flash", message: error.message }`.
       - Implement `generateText(prompt: string, systemInstruction?: string): Promise<string>`:
         - Method to be used in Phase 3 for tailoring resumes and evaluating ATS scores.
    2. Create `server/src/routes/gemini.ts`:
       - Mount `GET /api/gemini/status` which calls `checkGeminiConnection()` and returns 200 with the result JSON.
    3. Mount `/api/gemini` in `server/src/index.ts`.

    AVOID: Throwing unhandled exceptions during startup when `GEMINI_API_KEY` is not set; USE graceful error catching and status indicators so the application runs offline or before user setup.
    USE: `gemini-2.5-flash` as primary model for low latency and high quality ATS/resume processing.
  </action>
  <verify>
    cd server && npx tsx -e "import { checkGeminiConnection } from './src/services/gemini.js'; checkGeminiConnection().then(r => console.log('Gemini check:', r))"
  </verify>
  <done>
    `checkGeminiConnection()` completes safely without crashing, returning an informative status object whether API key is provided or omitted.
  </done>
</task>

<task type="auto">
  <name>Build Master Resume & Jobs REST Endpoints with File Parser & Automated Tests</name>
  <files>
    server/src/routes/resume.ts
    server/src/routes/jobs.ts
    server/src/index.ts
    server/tests/api.test.ts
  </files>
  <action>
    Implement RESTful endpoints for Master Resume management, PDF/DOCX ingestion, and Jobs baseline, backed by Prisma and validated with Zod:
    1. Create `server/src/routes/resume.ts`:
       - `GET /api/resume`:
         - Find the first `MasterResume` record. If none exists, automatically call seed helper and return the seeded profile.
         - Parse the stringified JSON columns (`experience`, `projects`, `skills`, `education`, `certifications`) into typed JavaScript arrays.
         - Return 200 with `{ profile: MasterResumeProfile }`.
       - `PUT /api/resume`:
         - Accept request body, validate using `resumeProfileSchema` from `server/src/types/resume.ts`. Return 400 with validation details if invalid.
         - Serialize complex fields (`experience`, `projects`, etc.) to JSON strings and upsert into `MasterResume` table.
         - Return 200 with `{ profile: updatedProfile, message: "Master resume updated successfully" }`.
       - `POST /api/resume/seed`:
         - Reset or overwrite master resume with the rich default PM profile.
         - Return 200 with `{ profile: seededProfile, message: "Master resume reset to default profile" }`.
       - `POST /api/resume/upload`:
         - Use `multer` memory storage to accept single file with field name `"resume"` (`.pdf`, `.docx`, `.txt`).
         - Extract raw text using `pdf-parse` (for PDF) or `mammoth` (for DOCX).
         - Parse extracted text into structured `MasterResumeProfile` JSON (extracting name, contact, summary, work experience bullets, skills, education).
         - Upsert into `MasterResume` and return 200 with `{ profile: parsedProfile, message: "Resume parsed and imported successfully" }`.
    2. Create `server/src/routes/jobs.ts`:
       - `GET /api/jobs`:
         - Query all Job records ordered by `createdAt` desc. Support optional query param `?status=discovered`.
         - Return 200 with `{ jobs: Job[] }`.
       - `POST /api/jobs`:
         - Validate `{ title, company, location, url, description }`.
         - Upsert or create Job in SQLite. Return 201 with created record.
       - `GET /api/jobs/:id`:
         - Return job details or 404 if not found.
       - `DELETE /api/jobs/:id`:
         - Delete job by id, return 200 with `{ success: true }`.
    3. Mount `/api/resume` and `/api/jobs` in `server/src/index.ts`.
    4. Implement `server/tests/api.test.ts`:
       - Spin up server or invoke route handlers directly to verify:
         1. `GET /api/resume` returns a valid profile with experience bullets.
         2. `PUT /api/resume` updates candidate name and summary, and subsequent `GET /api/resume` returns the updated values.
         3. `PUT /api/resume` with invalid email/payload returns 400 Bad Request.
         4. `POST /api/jobs` creates a test job posting and `GET /api/jobs` retrieves it.
         5. `GET /api/gemini/status` responds with 200.

    AVOID: Returning raw unparsed JSON strings to the client; USE parsed typed objects so the frontend receives ready-to-consume arrays and objects.
    USE: Explicit Zod schema validation on PUT requests to ensure SQLite never stores corrupted or malformed resume structures.
  </action>
  <verify>
    cd server && npx tsx tests/api.test.ts
  </verify>
  <done>
    `npx tsx tests/api.test.ts` executes all API test cases and passes with zero errors.
  </done>
</task>

</tasks>

## Must-Haves
After all tasks complete, verify:
- [ ] `GET /api/resume` returns the parsed master resume profile
- [ ] `PUT /api/resume` updates the profile and persists to SQLite
- [ ] `POST /api/resume/upload` parses uploaded resume file
- [ ] `GET /api/gemini/status` returns status without crashing
- [ ] All automated tests in `server/tests/api.test.ts` pass

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] REST API endpoints operational and tested
