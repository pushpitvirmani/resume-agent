# Phase 4 Research: ATS Template Studio & Resume Builder

## Objective
Design the ATS Template Studio architecture:
1. Implement high-fidelity ATS resume templates, prominently featuring the **Harshit Kumar Technical PM** reference format.
2. Live interactive preview studio allowing seamless switching between Master Resume and any Tailored Resume.
3. Real-time visual customization controls (font family, font scale, margin spacing, accent colors).
4. Real-time ATS Formatting & Compliance Score Evaluator (verifying single-column flow, metric density, standard section headers, and page budgets).
5. Seamless DOM structure ready for Phase 5's PDF and DOCX export engine.

---

## 1. Reference Style & Template Archetypes

### Template 1: "Harshit Kumar Technical PM" (Primary User Benchmark)
- **Header**:
  - Name: Centered, uppercase with wide letter-spacing (`P U S H P I T   V I R M A N I`).
  - Contact Line: Centered directly below: `Location • Email • Phone • LinkedIn • Portfolio`.
- **Section Headers**:
  - Uppercase tracked (`S U M M A R Y`, `E X P E R I E N C E`, `S K I L L S`, `E D U C A T I O N`).
  - Solid bottom horizontal rule separator (1px `#334155` or `#000000`).
- **Summary**: High-density narrative paragraph highlighting AI/ML depth, user scale, ARR/revenue impact, and 0→1 leadership.
- **Experience Bullets**:
  - `Role Title • Company Name` (left) with `Start Date – End Date` (right).
  - Every bullet starts with a **bolded achievement hook** (`**Hook:** Rest of accomplishment...`).
  - Prominent quantified metrics (`%`, `$`, `X`, user scale).
- **Skills**:
  - Categorized tag rows separated by bullets (`•`) without graphics or boxes that block ATS parsers.

### Template 2: "Modern Minimalist PM"
- Left-aligned header with crisp border accent.
- Sub-headings for teams/domains, right-aligned dates in italics.
- Clean high-contrast typography optimized for both digital screening and human interview loops.

### Template 3: "Executive Product Leader"
- Extended executive profile summary with core leadership competencies.
- Prominent metrics callout strip for Director/VP scale (ARR growth, team size, GMV managed).

---

## 2. ATS Compliance & Formatting Score Algorithm

ATS parsers (Workday, Taleo, Greenhouse, Lever, iCIMS) parse plain text streams top-to-bottom and fail on complex CSS grids, multi-column tables, graphics, and icon fonts.

The ATS Compliance Checker tests 6 core heuristics:
1. **Single-Column Flow**: 100% compliant (no side-by-side columns that scramble reading order).
2. **Standard Section Headers**: Verifies conventional naming (`SUMMARY`, `EXPERIENCE`, `SKILLS`, `EDUCATION`).
3. **Metric Density**: Calculates percentage of experience bullets containing quantified numbers, `%`, `$`, or `X`. Target: >70%.
4. **ATS-Safe Typography**: Validates font against safe typefaces (Inter, Arial, Calibri, Georgia, Garamond).
5. **Contact Integrity**: Checks presence of valid email, phone, location, and LinkedIn URL.
6. **Page Budget Estimation**: Detects bullet line counts to alert user if content exceeds 1-page threshold.

---

## 3. Component Architecture & Data Flow

```
[ResumeStudio.tsx]
  ├── [StudioControlsBar]
  │     ├── Resume Source Switcher (Master vs. Job-Tailored)
  │     ├── Template Picker (Harshit Technical PM, Modern Minimalist, Executive Leader)
  │     ├── Typography & Spacing Controls (Font, Size, Margins, Accent)
  │     └── Quick Action: "Proceed to Export" (Phase 5 bridge)
  ├── [Main Preview Canvas]
  │     └── [ResumeDocument (US Letter 8.5" x 11")]
  │           └── Renders active template with live reactive styles
  └── [ATS Compliance Panel]
        ├── Overall ATS Compliance Score (e.g. 96%)
        ├── Checklist (Single-column, Standard Headers, Metrics Density)
        └── Metric Density Gauge
```
