---
phase: 1
plan: 2
wave: 2
depends_on:
  - "01-PLAN.md"
files_modified:
  - server/src/services/ai.ts
  - server/src/routes/ai.ts
  - server/src/routes/resume.ts
  - server/src/routes/guidelines.ts
  - server/src/routes/jobs.ts
  - server/src/index.ts
  - server/tests/api.test.ts
autonomous: true
gap_closure: false
user_setup:
  - service: ai-providers
    why: "AI resume tailoring, keyword extraction, and ATS scoring"
    env_vars:
      - name: GEMINI_API_KEY
        source: "Google AI Studio (https://aistudio.google.com/app/apikey) - Primary"
      - name: ANTHROPIC_API_KEY
        source: "Anthropic Console (https://console.anthropic.com/) - Optional"
      - name: OPENAI_API_KEY
        source: "OpenAI Platform (https://platform.openai.com/api-keys) - Optional"

must_haves:
  truths:
    - "GET /api/ai/status returns structured connection info for Gemini, Claude, and GPT without crashing"
    - "GET /api/resume returns the structured master resume profile with parsed arrays for experience and skills"
    - "PUT /api/resume validates payload against schema and updates the database record"
    - "POST /api/resume/upload accepts PDF/DOCX files, parses text, and populates master resume"
    - "GET, POST, PATCH, DELETE on /api/guidelines manages user-confirmed resume guidelines"
    - "POST /api/jobs and GET /api/jobs create and list job postings"
    - "Automated API tests pass, validating all CRUD endpoints"
  artifacts:
    - "server/src/services/ai.ts"
    - "server/src/routes/ai.ts"
    - "server/src/routes/resume.ts"
    - "server/src/routes/guidelines.ts"
    - "server/src/routes/jobs.ts"
    - "server/tests/api.test.ts"
---

# Plan 1.2: Multi-Model AI Engine Client & Master Resume REST APIs

## Objective
Implement the Multi-Model AI integration service (supporting Google Gemini as default, alongside Anthropic Claude and OpenAI GPT) with connection health monitoring and model switching, alongside RESTful API endpoints for managing the Master Resume profile (retrieve, update with Zod validation, reset to seed, and PDF/DOCX file upload parser), the Confirmed Resume Guidelines (`/api/guidelines`), and baseline Job records. Provide an automated test suite verifying data roundtrip and API behavior.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- .gsd/ROADMAP.md
- .gsd/DECISIONS.md
- server/prisma/schema.prisma
- server/src/db.ts
- server/src/types/resume.ts

## Tasks

<task type="auto">
  <name>Implement Multi-Model AI Service (Gemini, Claude, GPT) & Status Endpoint</name>
  <files>
    server/src/services/ai.ts
    server/src/routes/ai.ts
    server/src/index.ts
  </files>
  <action>
    Create a resilient multi-provider AI service layer supporting Gemini, Claude, and GPT:
    1. Create `server/src/services/ai.ts`:
       - Define supported providers: `'gemini'` (default), `'claude'`, `'openai'`.
       - Read keys from environment: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`.
       - Implement `checkAIStatus(provider?: string): Promise<{ activeProvider: string; providers: Record<string, { configured: boolean; model: string; connected: boolean; message: string }> }>`:
         - Tests the configured provider with a minimal ping without crashing if any key is missing.
         - Default model for Gemini: `gemini-2.5-flash` (or `gemini-1.5-flash`).
         - Default model for Claude: `claude-3-5-sonnet-20241022` (or `claude-3-5-haiku-20241022`).
         - Default model for OpenAI: `gpt-4o` (or `gpt-4o-mini`).
       - Implement unified `generateText(prompt: string, systemInstruction?: string, providerOverride?: string): Promise<string>`:
         - Routes prompt to the active provider SDK.
    2. Create `server/src/routes/ai.ts`:
       - Mount `GET /api/ai/status` which calls `checkAIStatus()` and returns 200 with provider connection statuses.
       - Mount `GET /api/gemini/status` as a backward-compatible alias.
       - Mount `POST /api/ai/select` accepting `{ provider: 'gemini' | 'claude' | 'openai' }` to switch the active runtime model.
    3. Mount `/api/ai` and `/api/gemini` in `server/src/index.ts`.

    AVOID: Crashing during boot when API keys are absent; USE safe error boundaries returning `{ configured: false }`.
    USE: `gemini-2.5-flash` as primary default provider.
  </action>
  <verify>
    cd server && npx tsx -e "import { checkAIStatus } from './src/services/ai.js'; checkAIStatus().then(r => console.log('AI status check:', r))"
  </verify>
  <done>
    `checkAIStatus()` runs safely and outputs status for Gemini, Claude, and OpenAI without unhandled exceptions.
  </done>
</task>

<task type="auto">
  <name>Build Master Resume, Guidelines & Jobs REST Endpoints with File Parser & Tests</name>
  <files>
    server/src/routes/resume.ts
    server/src/routes/guidelines.ts
    server/src/routes/jobs.ts
    server/src/index.ts
    server/tests/api.test.ts
  </files>
  <action>
    Implement RESTful endpoints for Master Resume management, PDF/DOCX ingestion, Learned Guidelines, and Jobs baseline, backed by Prisma and validated with Zod:
    1. Create `server/src/routes/resume.ts`:
       - `GET /api/resume`:
         - Find the first `MasterResume` record. If none exists, automatically call seed helper and return the seeded profile.
         - Parse the stringified JSON columns into typed JavaScript arrays.
         - Return 200 with `{ profile: MasterResumeProfile }`.
       - `PUT /api/resume`:
         - Accept request body, validate using `resumeProfileSchema` from `server/src/types/resume.ts`.
         - Serialize complex fields to JSON strings and upsert into `MasterResume` table.
         - Return 200 with `{ profile: updatedProfile, message: "Master resume updated successfully" }`.
       - `POST /api/resume/seed`:
         - Reset or overwrite master resume with the rich default PM profile.
         - Return 200 with `{ profile: seededProfile, message: "Master resume reset to default profile" }`.
       - `POST /api/resume/upload`:
         - Use `multer` memory storage to accept single file with field name `"resume"` (`.pdf`, `.docx`, `.txt`).
         - Extract raw text using `pdf-parse` (for PDF) or `mammoth` (for DOCX).
         - Parse extracted text into structured `MasterResumeProfile` JSON.
         - Upsert into `MasterResume` and return 200 with `{ profile: parsedProfile, message: "Resume parsed and imported successfully" }`.
    2. Create `server/src/routes/guidelines.ts`:
       - `GET /api/guidelines`:
         - Query all `ResumeGuideline` records ordered by `createdAt` desc.
         - Return 200 with `{ guidelines: ResumeGuideline[] }`.
       - `POST /api/guidelines`:
         - Validate `{ rule, category }`.
         - Create new `ResumeGuideline` record. Return 201 with `{ guideline, message: "Guideline saved successfully" }`.
       - `PATCH /api/guidelines/:id`:
         - Accept `{ active: boolean }` and update status. Return 200 with updated record.
       - `DELETE /api/guidelines/:id`:
         - Delete guideline by id. Return 200 with `{ success: true }`.
    3. Create `server/src/routes/jobs.ts`:
       - `GET /api/jobs`: Query all Job records ordered by `createdAt` desc.
       - `POST /api/jobs`: Validate and upsert Job. Return 201.
       - `GET /api/jobs/:id`: Return job details.
       - `DELETE /api/jobs/:id`: Delete job by id.
    4. Mount `/api/resume`, `/api/guidelines`, and `/api/jobs` in `server/src/index.ts`.
    5. Implement `server/tests/api.test.ts`:
       - Spin up server or invoke route handlers directly to verify:
         1. `GET /api/resume` returns a valid profile with experience bullets.
         2. `PUT /api/resume` updates candidate name and summary, and subsequent `GET /api/resume` returns the updated values.
         3. `POST /api/guidelines` creates a guideline, `GET /api/guidelines` lists it, and `PATCH /api/guidelines/:id` toggles it.
         4. `POST /api/jobs` creates a test job posting and `GET /api/jobs` retrieves it.
         5. `GET /api/ai/status` responds with 200.

    AVOID: Storing unconfirmed rules; USE explicit POST requests only when the user confirms candidate guidelines in the UI.
    USE: Explicit Zod schema validation on PUT/POST requests.
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
- [ ] `GET /api/guidelines` and `POST /api/guidelines` manage confirmed rules
- [ ] `GET /api/ai/status` returns status without crashing
- [ ] All automated tests in `server/tests/api.test.ts` pass

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] REST API endpoints operational and tested
