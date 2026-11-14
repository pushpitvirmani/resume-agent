---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - package.json
  - tsconfig.json
  - .env.example
  - .gitignore
  - server/package.json
  - server/tsconfig.json
  - server/prisma/schema.prisma
  - server/src/db.ts
  - server/src/types/resume.ts
  - server/src/index.ts
  - server/prisma/seed.ts
autonomous: true
gap_closure: false

must_haves:
  truths:
    - "Root project and Express backend scaffold initialize and boot cleanly on Windows"
    - "SQLite database schema is created via Prisma with models for MasterResume, Job, TailoredResume, ResumeGuideline, and AppSettings"
    - "Database seed script successfully inserts Pushpit Virmani's actual master resume profile (from .gsd/MASTER_RESUME.json), baseline guidelines, and default scraper settings (max 25 jobs, past_week date filter)"
  artifacts:
    - "package.json"
    - "server/package.json"
    - "server/src/index.ts"
    - "server/prisma/schema.prisma"
    - "server/src/db.ts"
    - "server/src/types/resume.ts"
    - "server/prisma/seed.ts"
---

# Plan 1.1: Application Scaffold & Data Persistence Foundation

## Objective
Establish the project workspace architecture for the local personal web app with Node.js, Express, TypeScript, and Prisma with SQLite. Define typed relational schemas for the Master Resume profile (contact, summary, experience, projects, skills, education), Job postings, Learned Resume Guidelines (`ResumeGuideline`), and Application Settings (`AppSettings` storing scraper limits, date-from cutoff, and schedule). Execute the initial migration and seed script using Pushpit Virmani's actual master resume profile from `.gsd/MASTER_RESUME.json`.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- .gsd/ROADMAP.md
- .gsd/DECISIONS.md
- .gsd/MASTER_RESUME.json
- .gsd/STYLE_HARSHIT.md
- PROJECT_RULES.md

## Tasks

<task type="auto">
  <name>Scaffold Root Workspace & Express TypeScript Server</name>
  <files>
    package.json
    tsconfig.json
    .env.example
    .gitignore
    server/package.json
    server/tsconfig.json
    server/src/index.ts
  </files>
  <action>
    Configure the root workspace and scaffold the backend Express server with TypeScript:
    1. Create root `package.json` with scripts to run backend and frontend concurrently:
       `"dev:server": "npm --prefix server run dev"`,
       `"dev:client": "npm --prefix client run dev"`,
       `"dev": "concurrently \"npm run dev:server\" \"npm run dev:client\""`,
       `"build": "npm --prefix server run build && npm --prefix client run build"`,
       `"test": "npm --prefix server test"`.
       Install `concurrently` as a root devDependency.
    2. Create root `.gitignore` ignoring `node_modules`, `dist`, `.env`, `*.db`, `*.db-journal`, `client/dist`.
    3. Create `.env.example` documenting required environment variables:
       `PORT=5000`
       `DATABASE_URL="file:./dev.db"`
       `GEMINI_API_KEY=""`
       `ANTHROPIC_API_KEY=""`
       `OPENAI_API_KEY=""`
       Copy `.env.example` to `server/.env` if `server/.env` does not exist.
    4. In `server/package.json`, set `"type": "module"` and install:
       - Dependencies: `express`, `cors`, `dotenv`, `@prisma/client`, `@google/genai`, `@anthropic-ai/sdk`, `openai`, `zod`, `multer`, `pdf-parse`, `mammoth`.
       - DevDependencies: `typescript`, `@types/express`, `@types/cors`, `@types/node`, `@types/multer`, `@types/pdf-parse`, `tsx`, `prisma`.
       - Scripts: `"dev": "tsx watch src/index.ts"`, `"build": "tsc"`, `"start": "node dist/index.js"`, `"test": "tsx tests/api.test.ts"`.
    5. In `server/tsconfig.json`, target `ES2022`, module `NodeNext`, moduleResolution `NodeNext`, strict mode `true`, outDir `dist`.
    6. In `server/src/index.ts`, set up Express with `cors()`, `express.json()`, and an initial health route `GET /api/health` returning `{ status: "ok", timestamp: new Date().toISOString() }`. Listen on `process.env.PORT || 5000`.

    AVOID: Using platform-dependent shell commands in npm scripts; USE cross-platform scripts and `concurrently` so it executes identically on Windows.
    USE: `tsx` for TypeScript execution during development; it runs ESM and TypeScript without compilation hurdles.
  </action>
  <verify>
    npm install && cd server && npm install && npx tsx src/index.ts --test-run || node -e "import('http').then(h => console.log('Node ESM ready'))"
  </verify>
  <done>
    Root workspace and server packages install successfully, and Express server boots with health endpoint configured.
  </done>
</task>

<task type="auto">
  <name>Define Prisma SQLite Schema, Types, and Seed Master Resume Profile & Guidelines</name>
  <files>
    server/prisma/schema.prisma
    server/src/db.ts
    server/src/types/resume.ts
    server/prisma/seed.ts
  </files>
  <action>
    Define data persistence for Master Resume, Jobs, Learned Guidelines, and Settings using Prisma with SQLite:
    1. Create `server/prisma/schema.prisma`:
       - Datasource `db` using `provider = "sqlite"` and `url = env("DATABASE_URL")`.
       - Generator `client` using `provider = "prisma-client-js"`.
       - Model `MasterResume`:
         - `id` (String @id @default(uuid()))
         - `name` (String)
         - `email` (String)
         - `phone` (String?)
         - `location` (String?)
         - `linkedinUrl` (String?)
         - `portfolioUrl` (String?)
         - `summary` (String)
         - `experience` (String) // JSON serialized ExperienceItem[]
         - `projects` (String)   // JSON serialized ProjectItem[]
         - `skills` (String)     // JSON serialized SkillCategory[]
         - `education` (String)  // JSON serialized EducationItem[]
         - `certifications` (String?) // JSON serialized CertificationItem[]
         - `createdAt` (DateTime @default(now()))
         - `updatedAt` (DateTime @updatedAt)
       - Model `Job`:
         - `id` (String @id @default(uuid()))
         - `title` (String)
         - `company` (String)
         - `location` (String)
         - `url` (String @unique)
         - `description` (String)
         - `status` (String @default("discovered")) // discovered, tailoring, applied, archived
         - `matchScore` (Float?)
         - `keywords` (String?) // JSON serialized string[]
         - `postedDate` (DateTime?) // original posting date extracted from job
         - `createdAt` (DateTime @default(now()))
         - `updatedAt` (DateTime @updatedAt)
       - Model `TailoredResume`:
         - `id` (String @id @default(uuid()))
         - `jobId` (String)
         - `masterResumeId` (String)
         - `content` (String) // JSON serialized tailored profile
         - `atsScore` (Float?)
         - `feedbackHistory` (String?) // JSON serialized prompts/adjustments
         - `createdAt` (DateTime @default(now()))
         - `updatedAt` (DateTime @updatedAt)
       - Model `ResumeGuideline`:
         - `id` (String @id @default(uuid()))
         - `rule` (String)
         - `category` (String @default("general")) // metrics, style, summary, formatting
         - `active` (Boolean @default(true))
         - `createdAt` (DateTime @default(now()))
         - `updatedAt` (DateTime @updatedAt)
       - Model `AppSettings`:
         - `id` (String @id @default("default"))
         - `activeAiProvider` (String @default("gemini"))
         - `dailyScheduleCron` (String @default("0 9 * * *"))
         - `maxScrapeJobs` (Int @default(25)) // user-configurable postings limit
         - `scrapeDateFrom` (DateTime?) // scrape postings on or after this date
         - `dateFilterPreset` (String @default("past_week")) // past_24h, past_week, past_month, custom
         - `keywords` (String @default("Product Manager"))
         - `location` (String @default("Remote"))
         - `headless` (Boolean @default(true))
         - `updatedAt` (DateTime @updatedAt)
    2. Create `server/src/db.ts` initializing and exporting a PrismaClient singleton instance.
    3. Create `server/src/types/resume.ts` with TypeScript interfaces and Zod schemas:
       - `ExperienceItem`: id, company, role, location, startDate, endDate, isCurrent, bullets (string[])
       - `ProjectItem`: id, title, role, tools (string[]), link, bullets (string[])
       - `SkillCategory`: category, skills (string[])
       - `EducationItem`: id, institution, degree, fieldOfStudy, graduationYear, honors
       - `ResumeGuidelineItem`: id, rule, category, active, createdAt
       - `AppSettingsItem`: id, activeAiProvider, dailyScheduleCron, maxScrapeJobs, scrapeDateFrom, dateFilterPreset, keywords, location, headless
       - `MasterResumeProfile`: full typed profile matching the parsed fields
       - `resumeProfileSchema`: Zod schema validating input before database save.
       - `settingsSchema`: Zod schema validating scraper limits and date filters.
    4. Create `server/prisma/seed.ts` that:
       - Checks if a `MasterResume` record exists.
       - If not, inserts Pushpit Virmani's actual master profile directly from `.gsd/MASTER_RESUME.json` (Spyne.ai, Paytm, Cocolabs, Infosys, ESCP, MDI, DIT, and full skills list).
       - Inserts baseline guidelines into `ResumeGuideline` table.
       - Upserts default `AppSettings` with `maxScrapeJobs: 25`, `dateFilterPreset: "past_week"`.
    5. Run `npx prisma db push` to initialize the SQLite database file (`server/dev.db`) and run `npx tsx prisma/seed.ts`.

    AVOID: Relying on native node-gyp compilation drivers that fail on Windows machines; USE Prisma's bundled precompiled Rust query engine.
    USE: Typed JSON serialization for complex nested sections to provide both SQL queryability and flexible nested resume structures.
  </action>
  <verify>
    cd server && npx prisma db push && npx tsx prisma/seed.ts
  </verify>
  <done>
    `dev.db` is created in `server/`, Prisma client is generated, and seed script completes with confirmation that Pushpit Virmani's master resume profile, baseline guidelines, and AppSettings were inserted.
  </done>
</task>

</tasks>

## Must-Haves
After all tasks complete, verify:
- [ ] SQLite database is created at `server/dev.db` with tables for `MasterResume`, `Job`, `TailoredResume`, `ResumeGuideline`, and `AppSettings`
- [ ] PrismaClient singleton can read Pushpit Virmani's seeded master resume profile, guidelines, and app settings
- [ ] Server starts without runtime errors via `tsx src/index.ts`

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] Database schema is migration-ready and seed data exists with Pushpit Virmani's exact resume
