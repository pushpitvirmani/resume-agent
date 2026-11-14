---
phase: 1
plan: 3
wave: 3
depends_on:
  - "02-PLAN.md"
files_modified:
  - client/package.json
  - client/tsconfig.json
  - client/vite.config.ts
  - client/tailwind.config.js
  - client/postcss.config.js
  - client/src/index.css
  - client/src/types.ts
  - client/src/services/api.ts
  - client/src/App.tsx
  - client/src/components/Sidebar.tsx
  - client/src/components/Header.tsx
  - client/src/components/MasterResumeEditor.tsx
  - client/src/components/ExperienceEditor.tsx
  - client/src/components/JobsFeedPlaceholder.tsx
autonomous: true
gap_closure: false

must_haves:
  truths:
    - "User can view and edit their master resume profile (contact, summary, experience bullets, projects, skills, education) in the web UI"
    - "Saving changes sends a validated PUT request to the backend and updates the SQLite database"
    - "Reloading the page shows the persisted edits from the database"
    - "Dashboard header displays real-time Gemini API connection status badge"
    - "Client build passes cleanly with zero TypeScript or Tailwind compilation errors"
  artifacts:
    - "client/package.json"
    - "client/src/App.tsx"
    - "client/src/services/api.ts"
    - "client/src/components/Sidebar.tsx"
    - "client/src/components/Header.tsx"
    - "client/src/components/MasterResumeEditor.tsx"
    - "client/src/components/ExperienceEditor.tsx"
---

# Plan 1.3: Frontend Dashboard Shell & Master Resume Editor UI

## Objective
Build the responsive React + Vite + Tailwind CSS dashboard interface with application navigation, Gemini API status monitoring, and a comprehensive Master Resume profile editor fulfilling REQ-03. Provide intuitive management for contact details, summary, role-by-role bullet points, technical skills, and education with real-time save feedback.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- .gsd/ROADMAP.md
- server/src/types/resume.ts
- server/src/routes/resume.ts
- server/src/routes/gemini.ts

## Tasks

<task type="auto">
  <name>Scaffold Vite + React + Tailwind Frontend & Dashboard Navigation Shell</name>
  <files>
    client/package.json
    client/tsconfig.json
    client/vite.config.ts
    client/tailwind.config.js
    client/postcss.config.js
    client/src/index.css
    client/src/types.ts
    client/src/services/api.ts
    client/src/components/Sidebar.tsx
    client/src/components/Header.tsx
    client/src/components/JobsFeedPlaceholder.tsx
    client/src/App.tsx
  </files>
  <action>
    Scaffold the frontend client with modern tooling and shell components:
    1. In `client/package.json`, set `"type": "module"` and install:
       - Dependencies: `react`, `react-dom`, `lucide-react`, `clsx`, `tailwind-merge`.
       - DevDependencies: `typescript`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `vite`, `tailwindcss`, `postcss`, `autoprefixer`.
       - Scripts: `"dev": "vite"`, `"build": "tsc && vite build"`, `"preview": "vite preview"`.
    2. Configure `client/vite.config.ts` with React plugin and server proxy:
       ```ts
       server: {
         port: 3000,
         proxy: {
           '/api': {
             target: 'http://localhost:5000',
             changeOrigin: true
           }
         }
       }
       ```
    3. Configure `client/tailwind.config.js` and `client/postcss.config.js` with content scanning `./src/**/*.{ts,tsx}` and modern dark-mode ready slate theme.
    4. Create `client/src/types.ts` defining types matching the server:
       - `ResumeProfile`, `ExperienceItem`, `ProjectItem`, `SkillCategory`, `EducationItem`, `CertificationItem`, `JobItem`, `GeminiStatus`.
    5. Create `client/src/services/api.ts` exposing typed API calls:
       - `getResume(): Promise<ResumeProfile>`
       - `updateResume(data: ResumeProfile): Promise<{ profile: ResumeProfile; message: string }>`
       - `resetResumeSeed(): Promise<{ profile: ResumeProfile; message: string }>`
       - `getGeminiStatus(): Promise<{ connected: boolean; model: string; message: string }>`
       - `getJobs(status?: string): Promise<JobItem[]>`
       - `createJob(job: Partial<JobItem>): Promise<JobItem>`
    6. Implement shell layout:
       - `Sidebar.tsx`: Navigation items for "Master Resume", "Jobs Feed" (prepared for Phase 2), "AI Status / Settings" with active route indicator and sleek modern icons.
       - `Header.tsx`: Title, subtitle, and dynamic Gemini API badge:
         - Green badge: "Gemini API: Connected (gemini-2.5-flash)"
         - Amber badge: "Gemini API: Key Missing (Configure in server/.env)"
         - Red badge: "Gemini API: Connection Error"
       - `JobsFeedPlaceholder.tsx`: Clean UI placeholder displaying discovered jobs count (fetching from `api.getJobs()`), a "Manual Add Job" modal/form for testing, and an indicator that automated scraping will be connected in Phase 2.
       - `App.tsx`: Main layout assembling Sidebar, Header, and active tab view.

    AVOID: Absolute backend URLs in client fetch calls; USE Vite proxy configuration with `/api` relative paths so local development works without CORS headaches.
    USE: Lucide icons and Tailwind CSS utility classes for a clean, professional FAANG-grade dashboard appearance.
  </action>
  <verify>
    npm --prefix client run build
  </verify>
  <done>
    `npm --prefix client run build` succeeds without TypeScript or bundling errors, generating production assets.
  </done>
</task>

<task type="auto">
  <name>Build Master Resume Profile Editor UI (REQ-03)</name>
  <files>
    client/src/components/MasterResumeEditor.tsx
    client/src/components/ExperienceEditor.tsx
    client/src/App.tsx
  </files>
  <action>
    Implement the comprehensive Master Resume Editor interface fulfilling REQ-03:
    1. Create `client/src/components/MasterResumeEditor.tsx`:
       - On mount, call `api.getResume()` and initialize local editing state.
       - Render structured, collapsible sections:
         a) **Personal & Contact Info**: Inputs for Full Name, Email, Phone, Location, LinkedIn URL, Portfolio/GitHub URL.
         b) **Executive Summary**: Multiline textarea for the core product summary with character/word counter and quick tips for FAANG/AI positioning.
         c) **Work Experience**: Integrated via `ExperienceEditor.tsx`:
            - List of work experience cards.
            - "Add Experience" button.
            - Each card: Company name, Role title, Location, Start date, End date, "Current Role" toggle.
            - Bullet Points sub-editor: Add bullet point, remove bullet point, and reorder. Each bullet has an input with character length indicator.
         d) **Featured Projects**: Project title, role, tech stack/tools used, URL, and quantifiable impact bullets.
         e) **Core Skills**: Categorized skills (e.g. Product Strategy, AI & Machine Learning, Technical & Tools). Users can add new categories, add tags to categories, or remove tags.
         f) **Education & Certifications**: Institution, Degree, Field of study, Graduation year, Honors.
       - Action Bar:
         - "Save Master Resume" button: sends `api.updateResume(formData)`. Displays loading spinner while saving, then a green success notification toast ("Master resume updated successfully").
         - "Reset to Sample PM Profile" button: confirms with user and triggers `api.resetResumeSeed()`, updating the editor with standard high-impact PM content.
         - "Discard Changes" button to revert to the currently saved database state.
    2. Create `client/src/components/ExperienceEditor.tsx`:
       - Modular sub-component handling the list of experience items, role metadata inputs, and bullet point editing.
       - Ensures bullet points can be edited individually, deleted, or added dynamically.
    3. Connect `MasterResumeEditor` into the "Master Resume" tab in `App.tsx`.
    4. Provide user-friendly feedback on network errors or validation failures returned by the API.

    AVOID: In-place direct mutation of state arrays; USE immutable state update patterns or copy helpers when adding/updating/removing bullet points and array items.
    USE: Clear visual distinctions for high-impact metric bullets (e.g. badge indicators for metrics '%', '$', 'X') to reinforce FAANG-level PM resume quality.
  </action>
  <verify>
    npm --prefix client run build && cd server && npx tsx tests/api.test.ts
  </verify>
  <done>
    Frontend client compiles cleanly with all editor components, and backend test suite verifies that resume updates sent by the editor persist to the database.
  </done>
</task>

</tasks>

## Must-Haves
After all tasks complete, verify:
- [ ] User can view their master resume profile in the web interface
- [ ] User can add, edit, or remove experience bullet points and save changes to SQLite
- [ ] Saved changes remain when the web page is reloaded
- [ ] Header reflects Gemini API connection state
- [ ] `npm --prefix client run build` passes with zero errors

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] REQ-03 is completely satisfied with an interactive, verified UI and persistent local database storage
