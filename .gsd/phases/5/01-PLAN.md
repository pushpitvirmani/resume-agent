---
phase: 5
plan: 1
wave: 1
depends_on: []
files_modified:
  - server/package.json
  - server/src/services/docxExport.ts
  - server/src/routes/export.ts
  - server/src/index.ts
  - server/tests/export.test.ts
autonomous: true
gap_closure: false

must_haves:
  truths:
    - "Backend generates production-grade ATS-compliant Word documents (.docx) matching single-column specifications with bold hooks, uppercase tracked headers, and right-aligned dates"
    - "Export route POST /api/export/docx returns a valid .docx file stream with appropriate MIME type and Content-Disposition"
    - "Export route POST /api/export/batch accepts job IDs and exports a bundled .zip archive containing tailored resumes in .docx or .pdf format"
    - "Export tests verify document generation without errors"
  artifacts:
    - "server/src/services/docxExport.ts"
    - "server/src/routes/export.ts"
    - "server/tests/export.test.ts"
---

# Plan 5.1: Backend DOCX & PDF Export Engine & Batch Route

## Objective
Implement a production-grade DOCX generator using the `docx` library and batch export engine using `archiver` in Node.js/Express. Expose endpoints for single resume export (`.docx`, `.pdf`) and batch multi-job export (`.zip`), ensuring 100% single-column ATS parser compliance and bold hook fidelity.

## Context
- .gsd/SPEC.md
- server/src/types/resume.ts
- server/src/routes/resume.ts
- server/src/routes/tailor.ts

## Tasks

<task type="auto">
  <name>Install DOCX & Archiver and Build DOCX Generator Service</name>
  <files>
    server/package.json
    server/src/services/docxExport.ts
  </files>
  <action>
    1. In `server/`, install `docx` and `archiver` with `@types/archiver`.
    2. Create `server/src/services/docxExport.ts`:
       - Construct ATS-compliant `docx.Document`:
         - Single-column layout with 0.5in (720 dxa) standard margins.
         - Header: Candidate name in bold 22pt tracked uppercase, centered.
         - Contact line: Location • Email • Phone • LinkedIn • Portfolio in 9.5pt.
         - Section Headers: SUMMARY, EXPERIENCE, SKILLS, EDUCATION with horizontal bottom rule divider.
         - Experience entries: Company & Role on left (bold/semi-bold), Duration & Location right-aligned on same line using tab stop.
         - Accomplishment bullets: Parse `**bold hook**` into `TextRun({ bold: true })` and normal text into `TextRun({ bold: false })`.
         - Skills: Categorized skill listings with bullet separators.
         - Education: Institution & Degree with Graduation Year right-aligned.
       - Export helper function `generateResumeDocx(resumeData): Promise<Buffer>`.
  </action>
  <verify>
    Run a test node script generating a sample buffer from `generateResumeDocx` and checking buffer byte length > 2000.
  </verify>
</task>

<task type="auto">
  <name>Implement Export Routes & Batch ZIP Packaging</name>
  <files>
    server/src/routes/export.ts
    server/src/index.ts
  </files>
  <action>
    1. Create `server/src/routes/export.ts`:
       - `POST /docx`: accepts `{ resumeData }` or `{ jobId }`, generates DOCX buffer, sends with `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document` and `Content-Disposition: attachment; filename="Resume_<Candidate>_<Company>.docx"`.
       - `POST /batch`: accepts `{ jobIds: string[], format: 'docx' | 'pdf' }`. For each job ID, fetches tailored resume data, generates individual files, and streams a `.zip` archive via `archiver`.
       - `POST /pdf`: accepts `{ resumeData }` or `{ jobId }`, renders HTML/CSS print template and outputs clean PDF stream.
    2. Mount `router.use('/api/export', exportRouter)` in `server/src/index.ts`.
  </action>
  <verify>
    Test `POST /api/export/docx` with a sample payload using curl or PowerShell `Invoke-RestMethod` and verify status 200 and Content-Type.
  </verify>
</task>

<task type="auto">
  <name>Write Automated Export Tests</name>
  <files>
    server/tests/export.test.ts
  </files>
  <action>
    Create `server/tests/export.test.ts` to test:
    - Direct DOCX generation from master resume data.
    - `POST /api/export/docx` response format and headers.
    - `POST /api/export/batch` ZIP creation with multiple simulated jobs.
  </action>
  <verify>
    Execute `npx tsx server/tests/export.test.ts` and verify all tests pass with code 0.
  </verify>
</task>
