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
    - "SQLite database schema is created via Prisma with models for MasterResume, Job, and TailoredResume"
    - "Database seed script successfully inserts a rich default FAANG/AI PM master resume profile"
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
Establish the project workspace architecture for the local personal web app with Node.js, Express, TypeScript, and Prisma with SQLite. Define typed relational schemas for the Master Resume profile (contact, summary, experience, projects, skills, education) and Job postings, and execute the initial migration and seed script with a comprehensive default Product Management profile.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- .gsd/ROADMAP.md

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
       Copy `.env.example` to `server/.env` if `server/.env` does not exist.
    4. In `server/package.json`, set `"type": "module"` and install:
       - Dependencies: `express`, `cors`, `dotenv`, `@prisma/client`, `@google/genai`, `zod`.
       - DevDependencies: `typescript`, `@types/express`, `@types/cors`, `@types/node`, `tsx`, `prisma`.
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
  <name>Define Prisma SQLite Schema, Types, and Seed Master Resume Profile</name>
  <files>
    server/prisma/schema.prisma
    server/src/db.ts
    server/src/types/resume.ts
    server/prisma/seed.ts
  </files>
  <action>
    Define data persistence for Master Resume and Jobs using Prisma with SQLite:
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
    2. Create `server/src/db.ts` initializing and exporting a PrismaClient singleton instance.
    3. Create `server/src/types/resume.ts` with TypeScript interfaces and Zod schemas:
       - `ExperienceItem`: id, company, role, location, startDate, endDate, isCurrent, bullets (string[])
       - `ProjectItem`: id, title, role, tools (string[]), link, bullets (string[])
       - `SkillCategory`: category (e.g. "Product Strategy", "AI & Machine Learning", "Analytics & Tech"), skills (string[])
       - `EducationItem`: id, institution, degree, fieldOfStudy, graduationYear, honors
       - `MasterResumeProfile`: full typed profile matching the parsed fields
       - `resumeProfileSchema`: Zod schema validating input before database save.
    4. Create `server/prisma/seed.ts` that:
       - Checks if a `MasterResume` record exists.
       - If not, inserts a comprehensive FAANG/AI startup Senior Product Manager profile with realistic metrics, high-impact bullet points (e.g., "$12M ARR driven", "LLM latency reduced by 42%"), technical skill categories, and top-tier education.
    5. Run `npx prisma db push` to initialize the SQLite database file (`server/dev.db`) and run `npx tsx prisma/seed.ts`.

    AVOID: Relying on native node-gyp compilation drivers (like better-sqlite3) that frequently fail on Windows machines lacking Visual Studio build tools; USE Prisma's bundled precompiled Rust query engine.
    USE: Typed JSON serialization for complex nested sections (experience bullets, skills) to provide both SQL queryability and flexible nested resume structures.
  </action>
  <verify>
    cd server && npx prisma db push && npx tsx prisma/seed.ts
  </verify>
  <done>
    `dev.db` is created in `server/`, Prisma client is generated, and seed script completes with confirmation that master resume profile was inserted.
  </done>
</task>

</tasks>

## Must-Haves
After all tasks complete, verify:
- [ ] SQLite database is created at `server/dev.db` with tables for `MasterResume`, `Job`, and `TailoredResume`
- [ ] PrismaClient singleton can read the seeded master resume profile
- [ ] Server starts without runtime errors via `tsx src/index.ts`

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] Database schema is migration-ready and seed data exists
