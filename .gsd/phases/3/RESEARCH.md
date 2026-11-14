# Phase 3 Research: Gemini AI Resume Tailoring, Visual Diff & Learned Feedback Loop

## Objective
Design the architecture for Phase 3:
1. Deep Job Description (JD) parsing and keyword extraction using Google Gemini API (`gemini-flash-latest`).
2. Factual, metric-preserving resume tailoring applying all active rules from `ResumeGuideline`.
3. Side-by-side visual diff studio with in-place editable fields.
4. Interactive revision chat loop that refines content and extracts candidate global rules.
5. Strict user confirmation enforcement before persisting any learned guideline.

---

## 1. Tailoring Prompt Architecture & Schema

### Inputs
- **Master Resume:** Profile JSON containing Pushpit's verified career history (summary, experiences with metrics `%`, `$`, `X`, skills, education, projects).
- **Target Job Description:** Title, Company, Location, and full text extracted by scraper.
- **Active Guidelines:** List of rules from `ResumeGuideline` table (e.g. "Lead with strong action verbs", "Keep bullets under 2 lines", "Lead with bold hooks").

### Prompt Strategy
1. **Factual Grounding (No Hallucination):** Never invent past companies, degrees, dates, or false metrics. Rephrase and highlight existing achievements using the terminology and priorities of the target JD.
2. **Style Alignment (Harshit Reference Format):** Every tailored bullet must start with a bold impact hook (e.g. `**Platform Extensibility:** Spearheaded...`), quantify results with metrics, and integrate target ATS keywords organically.
3. **Structured JSON Output:** Enforce strict JSON schema via Gemini's system instructions and `response_mime_type: "application/json"`.

### Schema Definition
```json
{
  "summary": "Targeted executive summary...",
  "experience": [
    {
      "id": "exp_id",
      "company": "Company",
      "role": "Role",
      "bullets": [
        {
          "original": "Master bullet text",
          "tailored": "**Hook:** Tailored bullet text...",
          "changes": "Brief explanation of alignment"
        }
      ]
    }
  ],
  "skills": [
    {
      "category": "Core Competencies",
      "skills": ["Skill 1", "Skill 2"]
    }
  ],
  "atsAnalysis": {
    "score": 92,
    "matchedKeywords": ["API Design", "B2B SaaS", "Roadmapping"],
    "missingKeywords": ["SOC2", "Kubernetes"],
    "summaryFeedback": "Strong alignment with core platform needs..."
  }
}
```

---

## 2. Learned Guidelines Protocol (Strict Constraint)

Per the user's explicit directive:
> "Any feedback provided in the admin panel for resume editing must be used to create general guidelines applied across all future resumes, requiring explicit user confirmation before any new rule is added."

### Protocol:
1. When user submits conversational feedback in the review studio (e.g., *"Make bullet 2 focus more on enterprise B2B sales and avoid using the word 'orchestrated'"*), the AI Refine engine:
   - Re-generates the tailored section addressing the prompt.
   - Analyzes whether the feedback expresses a general preference.
   - If generalizable, extracts a rule candidate:
     ```json
     {
       "candidateRule": "Avoid using passive or vague buzzwords like 'orchestrated'; specify exact action taken.",
       "category": "style",
       "reasoning": "User requested elimination of the word 'orchestrated' in favor of concrete action verbs."
     }
     ```
2. The server responds with `{ tailoredResume, suggestedGuideline: { rule, category, reasoning } }`.
3. The UI presents an explicit **"Add to Global Guidelines?"** modal/banner displaying:
   - Proposed rule text (editable by user)
   - Category selector
   - [Add to Global Rules] and [Dismiss for Now] buttons
4. The rule is written to the database (`POST /api/guidelines`) **ONLY** when the user explicitly clicks **"Add to Global Rules"**.

---

## 3. Side-by-Side Visual Diff & In-Place Editing

### Component UX (`TailorStudio.tsx`)
- **Top Bar:** Job selector dropdown (all discovered jobs from SQLite), ATS Score gauge, Target Title/Company, and "Re-Tailor" button.
- **Keyword Pills:** Matched keywords in emerald, missing keywords in amber.
- **Main Body Split View:**
  - Left pane: Master Resume reference (read-only or collapsible).
  - Right pane: Tailored Resume with highlighted changes, bold hooks, and clickable in-place editing for every bullet.
- **Revision Chat Drawer:** Floating or bottom panel with prompt input ("Shorten this bullet", "Highlight revenue impact", etc.).

---

## 4. Execution Plan Breakdown
- **Plan 3.1:** Backend AI tailoring engine (`server/src/services/tailor.ts`), prompt templates, ATS scoring algorithm, and REST endpoints (`/api/tailor`, `/api/tailor/:id/refine`, `/api/tailor/:id`).
- **Plan 3.2:** Frontend Tailor & Review Studio (`client/src/components/TailorStudio.tsx`), visual diff view, in-place bullet editing, ATS score breakdown, feedback chat drawer, and confirmation modal for learned guidelines.
