---
phase: 5
plan: 2
wave: 2
depends_on:
  - "05-01"
files_modified:
  - client/src/services/api.ts
  - client/src/components/ResumeStudio.tsx
  - client/src/components/TailorStudio.tsx
  - client/src/components/JobsFeedPanel.tsx
autonomous: true
gap_closure: false

must_haves:
  truths:
    - "Users can download tailored resumes in both PDF and Word DOCX formats directly from Resume Studio"
    - "Tailor & Review Studio includes 1-click Download buttons for PDF and DOCX"
    - "Job Feed supports multi-job selection checkboxes and a batch export action to download a ZIP archive containing all tailored resumes"
    - "Client build passes cleanly with zero TypeScript errors"
  artifacts:
    - "client/src/services/api.ts"
    - "client/src/components/ResumeStudio.tsx"
    - "client/src/components/TailorStudio.tsx"
    - "client/src/components/JobsFeedPanel.tsx"
---

# Plan 5.2: Client Export UI, Batch Selection & End-to-End Download Workflow

## Objective
Connect frontend interfaces to the export backend. Add download menus (PDF and DOCX) in `ResumeStudio.tsx` and `TailorStudio.tsx`, and build a multi-job selection batch export bar in `JobsFeedPanel.tsx` that downloads a single zipped archive of tailored resumes.

## Context
- .gsd/SPEC.md
- .gsd/phases/5/01-PLAN.md
- client/src/services/api.ts
- client/src/components/ResumeStudio.tsx
- client/src/components/TailorStudio.tsx
- client/src/components/JobsFeedPanel.tsx

## Tasks

<task type="auto">
  <name>Add Export Client API and File Download Helpers</name>
  <files>
    client/src/services/api.ts
  </files>
  <action>
    In `client/src/services/api.ts`, implement:
    - `downloadDocx(data: { resumeData?: any; jobId?: string }, filename?: string): Promise<void>`
    - `downloadPdf(data: { resumeData?: any; jobId?: string }, filename?: string): Promise<void>`
    - `downloadBatch(jobIds: string[], format: 'docx' | 'pdf', filename?: string): Promise<void>`
    - Helper utility to trigger native browser file save from `Blob` response.
  </action>
  <verify>
    Run `npm --prefix client run build` to verify type safety.
  </verify>
</task>

<task type="auto">
  <name>Add Export Actions in Resume Studio and Tailor Studio</name>
  <files>
    client/src/components/ResumeStudio.tsx
    client/src/components/TailorStudio.tsx
  </files>
  <action>
    1. In `ResumeStudio.tsx`:
       - Replace simple `window.print()` with a versatile "Export" dropdown menu:
         - "📄 Download PDF (Print 1-Pager)" (triggers browser print or backend PDF)
         - "📝 Download Word Document (.docx)" (calls `api.downloadDocx`)
       - Display a loading spinner during document generation.
    2. In `TailorStudio.tsx`:
       - Add "Download Tailored Resume" dropdown with DOCX and PDF options right next to the review action buttons.
  </action>
  <verify>
    Verify client build compiles cleanly.
  </verify>
</task>

<task type="auto">
  <name>Implement Multi-Job Batch Selection and Export Bar in Job Feed</name>
  <files>
    client/src/components/JobsFeedPanel.tsx
  </files>
  <action>
    1. In `JobsFeedPanel.tsx`:
       - Add selection checkboxes for jobs that have status `tailored` or `tailoring`.
       - Add "Select All Tailored" toggle.
       - Add a sticky floating batch action bar at the bottom when $\ge 1$ job is selected:
         - "X resumes selected"
         - "Export DOCX (.zip)"
         - "Export PDF (.zip)"
       - Trigger `api.downloadBatch` with selected job IDs and automatically download the ZIP archive.
  </action>
  <verify>
    Execute `npm --prefix client run build` and verify successful compilation.
  </verify>
</task>
