---
phase: 4
plan: 1
wave: 1
depends_on: []
files_modified:
  - client/src/types.ts
  - client/src/components/templates/HarshitTemplate.tsx
  - client/src/components/templates/MinimalistTemplate.tsx
  - client/src/components/templates/ExecutiveTemplate.tsx
  - client/src/components/templates/index.ts
autonomous: true
gap_closure: false

must_haves:
  truths:
    - "Harshit Kumar technical PM template strictly reproduces the user's reference resume style (centered tracked name, bold impact hooks on bullets, pipe-separated skills, right-aligned dates)"
    - "Template components accept standard resume profile data and customizable style options (font size, font family, margins, accent color)"
    - "All templates enforce 100% single-column layout for ATS parser compliance"
    - "Bold hooks in tailored bullets (**Hook:**) render cleanly as bolded HTML spans"
  artifacts:
    - "client/src/components/templates/HarshitTemplate.tsx"
    - "client/src/components/templates/MinimalistTemplate.tsx"
    - "client/src/components/templates/ExecutiveTemplate.tsx"
    - "client/src/components/templates/index.ts"
---

# Plan 4.1: ATS Template Engine & Harshit Reference Archetype

## Objective
Build the ATS template rendering library in React with 100% single-column compliance. Implement the primary **Harshit Kumar Technical PM** template matching `.gsd/STYLE_HARSHIT.md`, plus Modern Minimalist and Executive Leader archetypes. Support reactive typography, font-size scaling, margin controls, and accent color customization.

## Context
- .gsd/SPEC.md
- .gsd/STYLE_HARSHIT.md
- .gsd/phases/4/RESEARCH.md
- client/src/types.ts

## Tasks

<task type="auto">
  <name>Define Template Options Types and Build Harshit Reference Template</name>
  <files>
    client/src/types.ts
    client/src/components/templates/HarshitTemplate.tsx
  </files>
  <action>
    1. In `client/src/types.ts`, define:
       - `TemplateStyleOptions`: fontFamily ('Inter' | 'Arial' | 'Calibri' | 'Georgia' | 'Garamond'), fontSize ('compact' | 'standard' | 'relaxed'), spacing ('compact' | 'standard' | 'roomy'), accentColor (string).
       - `TemplateId`: 'harshit' | 'minimalist' | 'executive'.
       - `RenderableResume`: Unified structure for rendering either MasterResume or TailoredResume.
    2. Create `client/src/components/templates/HarshitTemplate.tsx`:
       - Header: Centered candidate name with wide uppercase tracking (`P U S H P I T   V I R M A N I`).
       - Contact line: Centered `Location • Email • Phone • LinkedIn • Portfolio`.
       - Section titles: Uppercase tracked (`S U M M A R Y`, `E X P E R I E N C E`, `S K I L L S`, `E D U C A T I O N`) with 1px solid bottom divider line.
       - Experience: `Role • Company` on left, `Dates` on right.
       - Bullets: Parse `**Hook:**` markdown syntax into bold spans `<strong>Hook:</strong> Rest of bullet...`.
       - Skills: Categorized tag lines with bullet separators (`•`).
       - Education: Degree & University on left, Graduation Year on right.
  </action>
  <verify>
    npm --prefix client run build
  </verify>
  <done>
    `HarshitTemplate.tsx` built and compiled with zero TypeScript errors.
  </done>
</task>

<task type="auto">
  <name>Build Modern Minimalist and Executive Leader Templates</name>
  <files>
    client/src/components/templates/MinimalistTemplate.tsx
    client/src/components/templates/ExecutiveTemplate.tsx
    client/src/components/templates/index.ts
  </files>
  <action>
    1. Create `client/src/components/templates/MinimalistTemplate.tsx`:
       - Left-aligned header with subtle left accent border.
       - Clean modern sans-serif typography, compact bullet spacing.
    2. Create `client/src/components/templates/ExecutiveTemplate.tsx`:
       - Emphasized executive narrative summary and core strategic pillars.
       - Metrics callout line and executive competency hierarchy.
    3. Create `client/src/components/templates/index.ts` exporting all templates and a unified `ResumeDocument` renderer.
  </action>
  <verify>
    npm --prefix client run build
  </verify>
  <done>
    All 3 ATS template archetypes exported and verified.
  </done>
</task>

</tasks>

## Must-Haves
- [ ] Harshit template reproduces reference format exactly
- [ ] All templates enforce single-column ATS structure
- [ ] Bold hooks render properly from markdown
- [ ] Client build passes cleanly
