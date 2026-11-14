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
  - client/src/components/OverviewDashboard.tsx
  - client/src/components/MasterResumeEditor.tsx
  - client/src/components/ExperienceEditor.tsx
  - client/src/components/ResumeUploadDropzone.tsx
  - client/src/components/JobsFeedPanel.tsx
  - client/src/components/SettingsPanel.tsx
autonomous: true
gap_closure: false

must_haves:
  truths:
    - "User can navigate between all 5 panel sections: Overview, Job Feed, Tailor Studio, Resume Builder, and Settings"
    - "Overview Dashboard displays key metric cards, 'Scrape Now' trigger, and Master Resume status"
    - "Job Feed includes a targeted keyword search bar to prevent random scraping"
    - "User can view and edit their master resume profile (contact, summary, experience bullets, projects, skills, education) in the web UI"
    - "User can drag-and-drop or select an existing PDF/DOCX resume file to automatically parse and populate fields"
    - "Settings panel allows setting maximum postings to scrape and date-from filter (with date picker and presets)"
    - "Settings panel allows inspecting and switching active AI model (Gemini, Claude, GPT) and managing confirmed global guidelines"
    - "Saving changes sends a validated PUT request to the backend and updates the SQLite database"
    - "Client build passes cleanly with zero TypeScript or Tailwind compilation errors"
  artifacts:
    - "client/package.json"
    - "client/src/App.tsx"
    - "client/src/services/api.ts"
    - "client/src/components/Sidebar.tsx"
    - "client/src/components/Header.tsx"
    - "client/src/components/OverviewDashboard.tsx"
    - "client/src/components/MasterResumeEditor.tsx"
    - "client/src/components/ResumeUploadDropzone.tsx"
    - "client/src/components/JobsFeedPanel.tsx"
    - "client/src/components/SettingsPanel.tsx"
---

# Plan 1.3: 5-Section Dashboard Panel, Scraper Settings & Master Resume Studio UI

## Objective
Build the responsive React + Vite + Tailwind CSS web application interface with the agreed 5-section navigation panel: Overview Dashboard, LinkedIn Job Feed (with targeted keyword search), Tailor & Review Studio (prepared for Phase 3), Resume Builder & Template Studio (prepared for Phase 4), and Settings Center (LinkedIn session, Scraper automation with postings limit & date-from filter, Multi-model AI selector, and confirmed Global Resume Guidelines manager). Provide full Master Resume management with one-click PDF/DOCX file upload parsing and persistent SQLite storage.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- .gsd/ROADMAP.md
- .gsd/DECISIONS.md
- PROJECT_RULES.md
- server/src/types/resume.ts
- server/src/routes/resume.ts
- server/src/routes/guidelines.ts
- server/src/routes/settings.ts
- server/src/routes/ai.ts

## Tasks

<task type="auto">
  <name>Scaffold 5-Section Navigation Shell, Overview Dashboard & Settings Panel with Scraper Limits</name>
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
    client/src/components/OverviewDashboard.tsx
    client/src/components/JobsFeedPanel.tsx
    client/src/components/SettingsPanel.tsx
    client/src/App.tsx
  </files>
  <action>
    Create the client architecture using Vite, React 18, TypeScript, Tailwind CSS, and Lucide React icons:
    1. In `client/package.json`, set name to `client`, version `1.0.0`, `"type": "module"`, scripts:
       `"dev": "vite"`, `"build": "tsc && vite build"`, `"preview": "vite preview"`.
       Install dependencies: `react`, `react-dom`, `lucide-react`, `clsx`, `tailwind-merge`.
       Install devDependencies: `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `vite`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`.
    2. Configure `client/vite.config.ts` with React plugin and server proxy (`/api` -> `http://localhost:5000`).
    3. Configure `client/tailwind.config.js` and `client/postcss.config.js` with content scanning `./src/**/*.{ts,tsx}` and modern dark-mode ready slate theme.
    4. Create `client/src/types.ts` defining types matching the server:
       - `ResumeProfile`, `ExperienceItem`, `ProjectItem`, `SkillCategory`, `EducationItem`, `CertificationItem`, `ResumeGuideline`, `AppSettings`, `JobItem`, `AIStatusResponse`.
    5. Create `client/src/services/api.ts` exposing typed API calls:
       - `getResume(): Promise<ResumeProfile>`
       - `updateResume(data: ResumeProfile): Promise<{ profile: ResumeProfile; message: string }>`
       - `uploadResume(file: File): Promise<{ profile: ResumeProfile; message: string }>`
       - `resetResumeSeed(): Promise<{ profile: ResumeProfile; message: string }>`
       - `getSettings(): Promise<AppSettings>`
       - `updateSettings(data: Partial<AppSettings>): Promise<{ settings: AppSettings; message: string }>`
       - `getAIStatus(): Promise<AIStatusResponse>`
       - `selectAIProvider(provider: string): Promise<{ success: boolean; activeProvider: string }>`
       - `getGuidelines(): Promise<ResumeGuideline[]>`
       - `createGuideline(rule: string, category?: string): Promise<ResumeGuideline>`
       - `toggleGuideline(id: string, active: boolean): Promise<ResumeGuideline>`
       - `deleteGuideline(id: string): Promise<{ success: boolean }>`
       - `getJobs(status?: string): Promise<JobItem[]>`
       - `createJob(job: Partial<JobItem>): Promise<JobItem>`
    6. Implement shell layout:
       - `Sidebar.tsx`: 5 navigation links with clean modern icons:
         1. "Overview" (`LayoutDashboard`)
         2. "LinkedIn Jobs" (`Briefcase`)
         3. "Tailor & Review" (`Sparkles` - Phase 3)
         4. "Resume Studio" (`FileText` - Phase 4)
         5. "Settings" (`Settings`)
       - `Header.tsx`: Title, active route breadcrumb, and dynamic AI provider badge displaying active model with connection status indicator.
       - `OverviewDashboard.tsx`: Metric cards (Discovered Jobs, Tailored Resumes, Avg ATS Score, Next Scheduled Scrape), "Scrape Now" trigger button, quick link to Master Resume, and recent job feed table.
       - `JobsFeedPanel.tsx`: Targeted keyword search bar (preventing random scrapes), filter pills (Product Manager titles, Location, Remote), split table view with JD preview drawer, and "Tailor Selected Resumes" action bar.
       - `SettingsPanel.tsx`: 4 tabbed cards:
         1. LinkedIn Session (cookie status indicator, session link, connection test)
         2. Automation & Scraper Limits:
            - **Max Postings Limit**: Number input + quick preset chips (10, 25, 50, 100 postings per scrape)
            - **Date Filter ("From Date Onwards")**: Preset dropdown ("Past 24 Hours", "Past 7 Days", "Past 30 Days", "Custom Date") + Date Picker input (`type="date"`) when custom is selected
            - Schedule frequency cron input & headless browser toggle
            - "Save Scraper Settings" button calling `api.updateSettings()`
         3. AI Engine (Provider switcher between Gemini, Claude, and GPT with respective API key fields and live latency test)
         4. Global Resume Guidelines (view confirmed guidelines, toggle active status, add manual rule, delete rule)
       - `App.tsx`: Main layout assembling Sidebar, Header, and active panel routing.

    AVOID: Hardcoded static mockups; USE reactive hooks (`useState`, `useEffect`) and typed `api.ts` calls so all metric cards and status badges reflect real SQLite and API states.
    USE: Professional FAANG-level UI styling with subtle borders, clean typography, and accessible contrast.
  </action>
  <verify>
    npm --prefix client run build
  </verify>
  <done>
    `npm --prefix client run build` succeeds without TypeScript or bundling errors, generating production assets.
  </done>
</task>

<task type="auto">
  <name>Build Master Resume Profile Editor UI with PDF/DOCX Upload Dropzone (REQ-03)</name>
  <files>
    client/src/components/MasterResumeEditor.tsx
    client/src/components/ExperienceEditor.tsx
    client/src/components/ResumeUploadDropzone.tsx
    client/src/App.tsx
  </files>
  <action>
    Implement the comprehensive Master Resume Editor interface fulfilling REQ-03:
    1. Create `client/src/components/ResumeUploadDropzone.tsx`:
       - Drag & drop file area accepting `.pdf` and `.docx` files.
       - On upload, calls `api.uploadResume(file)` with a progress/loading spinner.
       - On completion, invokes callback `onUploadComplete(parsedProfile)` to refresh and fill the editor form instantly.
    2. Create `client/src/components/MasterResumeEditor.tsx`:
       - On mount, call `api.getResume()` and initialize local editing state.
       - Show `ResumeUploadDropzone` banner at the top allowing instant import from existing resume files.
       - Render structured, collapsible sections:
         a) **Personal & Contact Info**: Inputs for Full Name, Email, Phone, Location, LinkedIn URL, Portfolio/GitHub URL.
         b) **Executive Summary**: Multiline textarea for the core product summary with character/word counter and quick tips for FAANG/AI positioning.
         c) **Work Experience**: Integrated via `ExperienceEditor.tsx`:
            - List of work experience cards.
            - "Add Experience" button.
            - Each card: Company name, Role title, Location, Start date, End date, "Current Role" toggle.
            - Bullet Points sub-editor: Add bullet point, remove bullet point, and reorder. Each bullet has an input with character length indicator and metric badge ('%', '$', 'X').
         d) **Featured Projects**: Project title, role, tech stack/tools used, URL, and quantifiable impact bullets.
         e) **Core Skills**: Categorized skills (e.g. Product Strategy, AI & Machine Learning, Technical & Tools). Users can add new categories, add tags to categories, or remove tags.
         f) **Education & Certifications**: Institution, Degree, Field of study, Graduation year, Honors.
       - Action Bar:
         - "Save Master Resume" button: sends `api.updateResume(formData)`. Displays loading spinner while saving, then a green success notification toast ("Master resume updated successfully").
         - "Reset to Sample PM Profile" button: confirms with user and triggers `api.resetResumeSeed()`, updating the editor with standard high-impact PM content.
         - "Discard Changes" button to revert to the currently saved database state.
    3. Create `client/src/components/ExperienceEditor.tsx`:
       - Modular sub-component handling the list of experience items, role metadata inputs, and bullet point editing.
       - Ensures bullet points can be edited individually, deleted, or added dynamically.
    4. Connect `MasterResumeEditor` into the web app navigation in `App.tsx`.
    5. Provide user-friendly feedback on network errors or validation failures returned by the API.

    AVOID: In-place direct mutation of state arrays; USE immutable state update patterns or copy helpers when adding/updating/removing bullet points and array items.
    USE: Clear visual distinctions for high-impact metric bullets to reinforce FAANG-level PM resume quality.
  </action>
  <verify>
    npm --prefix client run build && cd server && npx tsx tests/api.test.ts
  </verify>
  <done>
    Frontend client compiles cleanly with all editor and upload components, and backend test suite verifies that resume updates sent by the editor persist to the database.
  </done>
</task>

</tasks>

## Must-Haves
After all tasks complete, verify:
- [ ] User can navigate between all 5 panel sections: Overview, Job Feed, Tailor Studio, Resume Builder, and Settings
- [ ] Overview Dashboard displays key metrics, "Scrape Now" trigger, and Master Resume status
- [ ] Job Feed includes targeted keyword search bar to prevent random scraping
- [ ] User can view their master resume profile in the web interface
- [ ] User can upload an existing PDF/DOCX resume and view extracted fields populated in the editor
- [ ] Settings panel allows setting maximum postings to scrape and date-from filter (with date picker and presets)
- [ ] Settings panel allows inspecting and switching AI provider (Gemini, Claude, GPT) and managing confirmed global guidelines
- [ ] User can add, edit, or remove experience bullet points and save changes to SQLite
- [ ] Saved changes remain when the web page is reloaded
- [ ] `npm --prefix client run build` passes with zero errors

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] Scraper limits and date cutoff are completely controllable from Settings and backed by SQLite
