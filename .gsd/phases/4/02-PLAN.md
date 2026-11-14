---
phase: 4
plan: 2
wave: 2
depends_on:
  - 01-PLAN.md
files_modified:
  - client/src/components/ATSScoreEvaluator.tsx
  - client/src/components/ResumeStudio.tsx
  - client/src/App.tsx
  - client/src/components/Sidebar.tsx
autonomous: true
gap_closure: false

must_haves:
  truths:
    - "Resume Studio renders a responsive, print-dimensioned document canvas (US Letter 8.5in x 11in)"
    - "User can switch resume source between Master Resume and any Tailored Job resume"
    - "Live customization controls update template family, font size, margins, and accent color in real time"
    - "ATS Score Evaluator calculates real-time compliance score and provides a 6-point checklist"
    - "Frontend client compiles with 0 errors"
  artifacts:
    - "client/src/components/ATSScoreEvaluator.tsx"
    - "client/src/components/ResumeStudio.tsx"
---

# Plan 4.2: Studio Workspace, Customization Controls & Real-Time ATS Compliance Evaluator

## Objective
Build the interactive "Resume Studio" (`ResumeStudio.tsx`), combining live template switching (Harshit Kumar, Modern Minimalist, Executive Leader), resume source toggling (Master vs. Job-Tailored), real-time styling controls, and an instant ATS Compliance & Formatting Score checker.

## Context
- .gsd/SPEC.md
- .gsd/STYLE_HARSHIT.md
- .gsd/phases/4/01-PLAN.md
- client/src/components/templates/index.ts
- client/src/types.ts

## Tasks

<task type="auto">
  <name>Build ATS Compliance Evaluator Component</name>
  <files>
    client/src/components/ATSScoreEvaluator.tsx
  </files>
  <action>
    Create `client/src/components/ATSScoreEvaluator.tsx`:
    1. Calculate compliance score across 6 heuristics:
       - Single-column structure (100% compliant)
       - Standard section headings (Summary, Experience, Skills, Education)
       - Quantified metric density (% of bullets containing %, $, or X metrics)
       - Contact info completeness (Email, Phone, Location, LinkedIn)
       - ATS-safe font selection
       - Content density & page fit estimation
    2. Display overall ATS Compliance badge (e.g. 96%), circular gauge, and an interactive pass/warn/recommend checklist with helpful guidance.
  </action>
  <verify>
    npm --prefix client run build
  </verify>
  <done>
    `ATSScoreEvaluator.tsx` built and compiled cleanly.
  </done>
</task>

<task type="auto">
  <name>Build Resume Studio Workspace and Wire Into App</name>
  <files>
    client/src/components/ResumeStudio.tsx
    client/src/App.tsx
    client/src/components/Sidebar.tsx
  </files>
  <action>
    1. Create `client/src/components/ResumeStudio.tsx`:
       - Source switcher: Select between "Master Resume (Pushpit Virmani)" or any "Tailored Resume" for scraped jobs.
       - Customization toolbar:
         - Template Archetype: Harshit Technical PM, Modern Minimalist, Executive Leader.
         - Font Family: Inter, Arial, Calibri, Georgia, Garamond.
         - Font Size: Compact (9.5pt), Standard (10pt), Relaxed (10.5pt).
         - Margin Spacing: Compact (0.5in), Standard (0.75in), Roomy (1.0in).
         - Accent Color Palette: Classic Slate, Tech Navy, Modern Indigo, Deep Emerald.
       - Main Viewport:
         - Real white page canvas styled to US Letter aspect ratio with shadow and page edge boundaries.
         - Renders selected template with active style options.
         - Zoom slider (75%, 90%, 100%, 125%).
       - Right Drawer / Sidebar:
         - Mounts `ATSScoreEvaluator`.
         - Quick bridge button: "Export to PDF / DOCX" (prompts Phase 5 readiness).
    2. Mount `ResumeStudio` in `client/src/App.tsx` for the `templates` tab.
    3. Update `client/src/components/Sidebar.tsx` badge for Resume Studio to "Live ATS".
  </action>
  <verify>
    npm --prefix client run build
  </verify>
  <done>
    Resume Studio fully functional in web app with live interactive preview.
  </done>
</task>

</tasks>

## Must-Haves
- [ ] ResumeStudio displays document canvas with live template rendering
- [ ] Source toggle switches between Master and Tailored resumes
- [ ] Style controls update canvas in real time
- [ ] ATS Compliance evaluator displays 6-point checklist
- [ ] Production build succeeds without errors
