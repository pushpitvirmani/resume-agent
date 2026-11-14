---
phase: 3
plan: 2
wave: 2
depends_on:
  - 01-PLAN.md
files_modified:
  - client/src/types.ts
  - client/src/services/api.ts
  - client/src/components/TailorStudio.tsx
  - client/src/components/GuidelineConfirmationModal.tsx
  - client/src/App.tsx
autonomous: true
gap_closure: false

must_haves:
  truths:
    - "Tailor & Review tab allows selecting any discovered job from the feed and triggering AI tailoring"
    - "Side-by-side visual diff compares Master Resume against Tailored Resume with highlighted changes"
    - "Tailored bullets and sections are editable in-place with instantaneous autosave / manual save"
    - "Interactive feedback chat allows conversational adjustments on bullets or sections"
    - "Explicit confirmation modal is shown when AI proposes a new guideline; rule is saved to database ONLY when user clicks confirm"
  artifacts:
    - "client/src/components/TailorStudio.tsx"
    - "client/src/components/GuidelineConfirmationModal.tsx"
---

# Plan 3.2: Frontend Tailor & Review Studio, Side-by-Side Diff, In-Place Editing & Learned Rule Confirmation

## Objective
Build the comprehensive "Tailor & Review" studio in the React frontend: job selection, one-click AI tailoring with Gemini, side-by-side visual diff comparing Master Resume vs. Tailored Resume, in-place bullet editing, ATS match score card, interactive revision chat drawer, and the mandatory explicit confirmation modal for learned guidelines.

## Context
- .gsd/SPEC.md
- .gsd/phases/3/01-PLAN.md
- client/src/components/TailorStudio.tsx
- client/src/services/api.ts
- client/src/types.ts

## Tasks

<task type="auto">
  <name>Extend Client Types and API Service for Tailoring</name>
  <files>
    client/src/types.ts
    client/src/services/api.ts
  </files>
  <action>
    1. In `client/src/types.ts`, define:
       - `TailoredResumeItem`: id, jobId, masterResumeId, content, atsScore, feedbackHistory, createdAt.
       - `TailoredContent`: summary, experience[], skills[], atsAnalysis.
       - `SuggestedGuideline`: rule, category, reasoning.
    2. In `client/src/services/api.ts`, implement:
       - `tailorResume(jobId: string)`
       - `getTailoredResume(id: string)`
       - `getTailoredResumeByJob(jobId: string)`
       - `updateTailoredResume(id: string, content: TailoredContent)`
       - `refineTailoredResume(id: string, feedback: string, section?: string, bulletIndex?: number)`
  </action>
  <verify>
    npm --prefix client run build
  </verify>
  <done>
    Client types and API client functions compiled cleanly.
  </done>
</task>

<task type="auto">
  <name>Build Tailor & Review Studio UI with Visual Diff and Confirmation Modal</name>
  <files>
    client/src/components/TailorStudio.tsx
    client/src/components/GuidelineConfirmationModal.tsx
    client/src/App.tsx
  </files>
  <action>
    1. Create `client/src/components/GuidelineConfirmationModal.tsx`:
       - Displays candidate rule with editable rule text and category selector.
       - Explains why the rule was derived from user feedback.
       - Provides "Add to Global Guidelines" (calls `api.createGuideline`) and "Dismiss" buttons.
       - **Strictly satisfies constraint:** No rule is added without user clicking "Add to Global Guidelines".
    2. Build `client/src/components/TailorStudio.tsx`:
       - Job selector header with ATS score radial/badge, matched and missing keywords tags.
       - "Tailor with Gemini" button with loading animation.
       - Side-by-side diff layout:
         - Left: Master Resume original bullets.
         - Right: Tailored bullets with bold hooks (`**Hook:**`) and in-place editable inputs.
       - Interactive Revision Chat Drawer:
         - Input box for conversational feedback ("Make bullet 2 more technical", "Emphasize revenue").
         - AI response handler that updates tailored bullets and opens `GuidelineConfirmationModal` when candidate rule is found.
    3. Update `client/src/App.tsx`:
       - Connect `TailorStudio` to the `tailor` tab with state persistence.
  </action>
  <verify>
    npm --prefix client run build
  </verify>
  <done>
    Frontend builds without errors and provides fully interactive Tailor & Review Studio.
  </done>
</task>

</tasks>

## Must-Haves
- [ ] TailorStudio renders side-by-side diff with Master Resume
- [ ] In-place editable text for tailored bullets
- [ ] Interactive feedback chat triggers refinement
- [ ] Guideline confirmation modal prevents automated rule creation
- [ ] Client build passes cleanly
