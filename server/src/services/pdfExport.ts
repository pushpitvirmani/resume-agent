import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ExportResumeData } from './docxExport.js';

const execAsync = promisify(exec);

// Escape HTML utility
function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Convert markdown bolding (**word**) into <strong>word</strong>
function formatMarkdownBullets(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="metric-bold">$1</strong>');
}

// Find Chrome or Edge executable on the system (Windows and Linux/Docker)
function findBrowserExecutable(): string {
  const candidates = [
    process.env.CHROME_BIN,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback to binary names in PATH
  return 'chrome';
}

// Template Accent Defaults
const TEMPLATE_ACCENTS: Record<string, string> = {
  harshit: '#0f172a',
  minimalist: '#4f46e5',
  executive: '#1e3a8a',
  ivyleague: '#1c1917',
  consulting: '#0369a1',
  aispecialist: '#6366f1',
  growth: '#047857',
  enterprise: '#1e40af',
  compact: '#ea580c',
  nordic: '#0d9488',
};

// Build clean, professional, ATS-compliant HTML for 1-page PDF
export function renderResumeHtml(data: ExportResumeData, styling?: any): string {
  const templateId = (styling?.templateId as string) || 'harshit';
  const options = styling?.options || {};

  const accent = options.accentColor || TEMPLATE_ACCENTS[templateId] || '#0f172a';
  const fontFamilyChoice = options.fontFamily || (templateId === 'ivyleague' ? 'Garamond' : 'Inter');
  const fontSizePreset = options.fontSize || (templateId === 'compact' ? 'compact' : 'standard');
  const spacingPreset = options.spacing || (templateId === 'compact' ? 'compact' : 'standard');

  const fontFamilies: Record<string, string> = {
    'Inter': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    'Roboto': "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    'Garamond': "'EB Garamond', Garamond, Georgia, serif",
    'Georgia': "Georgia, 'Times New Roman', serif",
    'JetBrains Mono': "'JetBrains Mono', 'Courier New', monospace",
    'Playfair Display': "'Playfair Display', Georgia, serif",
  };
  const activeFont = fontFamilies[fontFamilyChoice] || fontFamilies['Inter'];

  const sizePresets: Record<string, { body: string; lead: string; name: string; sectionTitle: string; roleTitle: string; date: string; meta: string }> = {
    compact: {
      body: '8.4pt',
      lead: '1.28',
      name: '17.5pt',
      sectionTitle: '9.6pt',
      roleTitle: '9pt',
      date: '7.8pt',
      meta: '7.8pt'
    },
    standard: {
      body: '9.2pt',
      lead: '1.38',
      name: '20.5pt',
      sectionTitle: '10.5pt',
      roleTitle: '10pt',
      date: '8.4pt',
      meta: '8.4pt'
    },
    relaxed: {
      body: '9.8pt',
      lead: '1.46',
      name: '23pt',
      sectionTitle: '11.5pt',
      roleTitle: '10.8pt',
      date: '9pt',
      meta: '9pt'
    }
  };
  const activeSizes = sizePresets[fontSizePreset] || sizePresets['standard'];

  const spacingPresets: Record<string, { pageMargin: string; sectionMargin: string; itemMargin: string; bulletMargin: string }> = {
    compact: {
      pageMargin: '6mm 8mm',
      sectionMargin: '5px',
      itemMargin: '3.5px',
      bulletMargin: '1.5px'
    },
    standard: {
      pageMargin: '8.5mm 10.5mm',
      sectionMargin: '8px',
      itemMargin: '5px',
      bulletMargin: '2.5px'
    },
    roomy: {
      pageMargin: '11mm 13mm',
      sectionMargin: '12px',
      itemMargin: '7.5px',
      bulletMargin: '3.5px'
    }
  };
  const activeSpacing = spacingPresets[spacingPreset] || spacingPresets['standard'];

  const isLeftAligned = ['minimalist', 'consulting', 'aispecialist', 'growth', 'enterprise', 'nordic'].includes(templateId);

  const contactParts: string[] = [];
  if (data.location) contactParts.push(escapeHtml(data.location));
  if (data.phone) contactParts.push(escapeHtml(data.phone));
  if (data.email) contactParts.push(`<a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>`);
  if (data.linkedinUrl) {
    const cleanUrl = data.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '');
    contactParts.push(`<a href="${escapeHtml(data.linkedinUrl)}" target="_blank">${escapeHtml(cleanUrl)}</a>`);
  }
  if (data.portfolioUrl) {
    const cleanPort = data.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '');
    contactParts.push(`<a href="${escapeHtml(data.portfolioUrl)}" target="_blank">${escapeHtml(cleanPort)}</a>`);
  }

  // Section title formatter
  const formatSectionTitle = (title: string, index: string = '01'): string => {
    if (templateId === 'harshit') {
      return title.toUpperCase().split('').join(' ');
    }
    if (templateId === 'aispecialist') {
      return `&gt; ${index}. ${title.toUpperCase()}`;
    }
    if (templateId === 'ivyleague') {
      return title.toUpperCase();
    }
    return title.toUpperCase();
  };

  const experienceHtml = (data.experience || [])
    .map((exp) => {
      const dates = [exp.startDate, exp.endDate].filter(Boolean).join(' – ');
      const bulletsHtml = (exp.bullets || [])
        .map((b) => `<li>${formatMarkdownBullets(b)}</li>`)
        .join('');

      return `
        <div class="exp-item">
          <div class="exp-header">
            <span class="role-title">${escapeHtml(exp.role)}</span>
            <span class="date-badge">${escapeHtml(dates)}</span>
          </div>
          <div class="company-subheader">
            <span class="company-name">${escapeHtml(exp.company)}</span>
            ${exp.location ? `<span class="location-text">${escapeHtml(exp.location)}</span>` : ''}
          </div>
          <ul class="bullet-list">
            ${bulletsHtml}
          </ul>
        </div>
      `;
    })
    .join('');

  const skillsHtml = (data.skills || [])
    .map((cat) => {
      if (templateId === 'aispecialist') {
        const chips = (cat.skills || [])
          .map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`)
          .join(' ');
        return `
          <div class="skill-row">
            <strong class="skill-category" style="color: ${accent}; font-family: monospace;">[${escapeHtml(cat.category)}]</strong>
            <span class="skill-chips">${chips}</span>
          </div>
        `;
      }
      const items = (cat.skills || []).map((s) => escapeHtml(s)).join(', ');
      return `
        <div class="skill-row">
          <strong class="skill-category">${escapeHtml(cat.category)}:</strong>
          <span class="skill-items">${items}</span>
        </div>
      `;
    })
    .join('');

  const educationHtml = (data.education || [])
    .map((edu) => {
      const degreeLine = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
      return `
        <div class="edu-item">
          <div class="edu-header">
            <span class="institution-name">${escapeHtml(edu.institution)}</span>
            ${edu.graduationYear ? `<span class="date-badge">${escapeHtml(edu.graduationYear)}</span>` : ''}
          </div>
          <div class="degree-text">${escapeHtml(degreeLine)}${edu.honors ? ` • <em>${escapeHtml(edu.honors)}</em>` : ''}</div>
        </div>
      `;
    })
    .join('');

  const projectsHtml = (data.projects || [])
    .map((proj) => {
      const bulletsHtml = (proj.bullets || [])
        .map((b) => `<li>${formatMarkdownBullets(b)}</li>`)
        .join('');
      return `
        <div class="exp-item">
          <div class="exp-header">
            <span class="role-title">${escapeHtml(proj.title)}${proj.role ? ` — ${escapeHtml(proj.role)}` : ''}</span>
            ${proj.link ? `<a class="date-badge" href="${escapeHtml(proj.link)}">${escapeHtml(proj.link.replace(/^https?:\/\//, ''))}</a>` : ''}
          </div>
          <ul class="bullet-list">
            ${bulletsHtml}
          </ul>
        </div>
      `;
    })
    .join('');

  const certificationsHtml = (data.certifications || [])
    .map((cert) => {
      return `
        <div class="cert-item">
          <strong>${escapeHtml(cert.name)}</strong> — ${escapeHtml(cert.issuer)} ${cert.year ? `(${escapeHtml(cert.year)})` : ''}
        </div>
      `;
    })
    .join('');

  // Formatted candidate name based on template
  const formattedCandidateName = templateId === 'harshit'
    ? escapeHtml(data.name).toUpperCase().split('').join(' ')
    : escapeHtml(data.name);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(data.name)} - Resume</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: letter portrait;
      margin: ${activeSpacing.pageMargin};
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: ${activeFont};
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: ${activeSizes.lead};
      font-size: ${activeSizes.body};
      -webkit-font-smoothing: antialiased;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    a {
      color: #0f172a;
      text-decoration: none;
    }
    .resume-container {
      width: 100%;
      max-width: 816px;
      margin: 0 auto;
    }
    /* Header variants */
    .header {
      padding-bottom: 6px;
      margin-bottom: ${activeSpacing.sectionMargin};
      ${
        templateId === 'executive'
          ? `border-top: 4px solid ${accent}; padding-top: 6px; border-bottom: 1.5px solid #cbd5e1;`
          : templateId === 'minimalist' || templateId === 'consulting'
          ? `border-bottom: 2.5px solid ${accent};`
          : templateId === 'ivyleague'
          ? `text-align: center; border-bottom: 0.75px solid #cbd5e1;`
          : templateId === 'nordic'
          ? `border-bottom: 1.5px solid ${accent};`
          : `border-bottom: 2px solid ${accent};`
      }
      ${isLeftAligned ? 'text-align: left;' : 'text-align: center;'}
    }
    .candidate-name {
      font-size: ${activeSizes.name};
      font-weight: 800;
      letter-spacing: ${templateId === 'harshit' ? '0.12em' : '-0.02em'};
      color: ${isLeftAligned ? accent : '#0f172a'};
      margin: 0 0 2px 0;
      line-height: 1.1;
    }
    .contact-bar {
      font-size: ${activeSizes.meta};
      color: #334155;
      display: flex;
      flex-wrap: wrap;
      ${isLeftAligned ? 'justify-content: flex-start;' : 'justify-content: center;'}
      gap: 3px 8px;
    }
    .contact-bar span:not(:last-child)::after {
      content: " ${isLeftAligned ? '|' : '•'}";
      margin-left: 6px;
      color: #94a3b8;
    }
    /* Section Headings */
    .section-title {
      font-size: ${activeSizes.sectionTitle};
      font-weight: 800;
      letter-spacing: ${templateId === 'harshit' ? '0.08em' : '0.04em'};
      color: ${accent};
      ${
        templateId === 'ivyleague'
          ? 'text-align: center; border-bottom: 0.75px solid #cbd5e1; letter-spacing: 0.1em;'
          : templateId === 'aispecialist'
          ? `font-family: monospace; border-bottom: 1.5px solid ${accent};`
          : `border-bottom: 1.5px solid ${accent};`
      }
      padding-bottom: 2px;
      margin-top: ${activeSpacing.sectionMargin};
      margin-bottom: ${activeSpacing.itemMargin};
      page-break-after: avoid;
      break-after: avoid;
    }
    /* Summary */
    .summary-text {
      font-size: ${activeSizes.body};
      color: #1e293b;
      margin: 0 0 ${activeSpacing.itemMargin} 0;
      line-height: ${activeSizes.lead};
      ${
        templateId === 'executive'
          ? `background: #f8fafc; border-left: 3.5px solid ${accent}; padding: 5px 8px; border-radius: 2px;`
          : ''
      }
    }
    /* Experience */
    .exp-item {
      margin-bottom: ${activeSpacing.itemMargin};
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: ${activeSizes.roleTitle};
    }
    .role-title {
      font-weight: 700;
      color: #0f172a;
    }
    .date-badge {
      font-size: ${activeSizes.date};
      font-weight: 600;
      color: #475569;
    }
    .company-subheader {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: ${activeSizes.body};
      font-style: ${templateId === 'ivyleague' ? 'italic' : 'normal'};
      color: #334155;
      margin-bottom: 1.5px;
    }
    .company-name {
      font-weight: 600;
      color: #1e293b;
    }
    .location-text {
      font-size: ${activeSizes.meta};
      color: #64748b;
      font-style: normal;
    }
    /* Bullet Points */
    .bullet-list {
      margin: 1px 0 ${activeSpacing.itemMargin} 15px;
      padding: 0;
    }
    .bullet-list li {
      font-size: ${activeSizes.body};
      color: #1e293b;
      margin-bottom: ${activeSpacing.bulletMargin};
      line-height: ${activeSizes.lead};
    }
    .metric-bold {
      font-weight: 700;
      color: #000000;
      ${templateId === 'growth' ? `color: ${accent}; font-weight: 800;` : ''}
    }
    /* Skills */
    .skill-row {
      font-size: ${activeSizes.body};
      margin-bottom: 2px;
      line-height: ${activeSizes.lead};
    }
    .skill-category {
      font-weight: 700;
      color: #0f172a;
    }
    .skill-items {
      color: #1e293b;
    }
    .skill-tag {
      display: inline-block;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 3px;
      padding: 0.5px 4px;
      font-family: monospace;
      font-size: 8pt;
      margin-right: 3px;
      color: #0f172a;
    }
    /* Education */
    .edu-item {
      margin-bottom: 3.5px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .edu-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: ${activeSizes.roleTitle};
      font-weight: 700;
      color: #0f172a;
    }
    .institution-name {
      font-weight: 700;
    }
    .degree-text {
      font-size: ${activeSizes.body};
      color: #334155;
    }
    /* Certifications */
    .cert-item {
      font-size: ${activeSizes.body};
      color: #1e293b;
      margin-bottom: 2px;
    }
  </style>
</head>
<body>
  <div class="resume-container">
    <!-- Header -->
    <header class="header">
      <h1 class="candidate-name">${formattedCandidateName}</h1>
      <div class="contact-bar">
        ${contactParts.map((p) => `<span>${p}</span>`).join('')}
      </div>
    </header>

    <!-- Professional Summary -->
    ${
      data.summary
        ? `
      <section>
        <div class="section-title">${formatSectionTitle('Professional Summary', '01')}</div>
        <p class="summary-text">${escapeHtml(data.summary)}</p>
      </section>
    `
        : ''
    }

    <!-- Core Competencies & Skills -->
    ${
      skillsHtml
        ? `
      <section>
        <div class="section-title">${formatSectionTitle('Core Competencies & Skills', '02')}</div>
        <div class="skills-section">
          ${skillsHtml}
        </div>
      </section>
    `
        : ''
    }

    <!-- Experience -->
    ${
      experienceHtml
        ? `
      <section>
        <div class="section-title">${formatSectionTitle('Professional Experience', '03')}</div>
        ${experienceHtml}
      </section>
    `
        : ''
    }

    <!-- Projects (if any) -->
    ${
      projectsHtml
        ? `
      <section>
        <div class="section-title">${formatSectionTitle('Key Projects & Strategic Initiatives', '04')}</div>
        ${projectsHtml}
      </section>
    `
        : ''
    }

    <!-- Education -->
    ${
      educationHtml
        ? `
      <section>
        <div class="section-title">${formatSectionTitle('Education', '05')}</div>
        ${educationHtml}
      </section>
    `
        : ''
    }

    <!-- Certifications (if any) -->
    ${
      certificationsHtml
        ? `
      <section>
        <div class="section-title">${formatSectionTitle('Certifications', '06')}</div>
        ${certificationsHtml}
      </section>
    `
        : ''
    }
  </div>
</body>
</html>`;
}

// Generate PDF Buffer using headless Chrome / Edge
export async function generateResumePdf(data: ExportResumeData, styling?: any): Promise<Buffer> {
  const browserPath = findBrowserExecutable();
  const htmlContent = renderResumeHtml(data, styling);

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const tmpHtml = path.join(os.tmpdir(), `resume_${timestamp}_${randomSuffix}.html`);
  const tmpPdf = path.join(os.tmpdir(), `resume_${timestamp}_${randomSuffix}.pdf`);

  try {
    fs.writeFileSync(tmpHtml, htmlContent, 'utf8');

    const cmd = `"${browserPath}" --headless=new --no-sandbox --disable-gpu --no-pdf-header-footer --print-to-pdf="${tmpPdf}" "${tmpHtml}"`;
    await execAsync(cmd, { timeout: 15000 });

    if (!fs.existsSync(tmpPdf)) {
      throw new Error('PDF output file was not generated by headless browser');
    }

    const pdfBuffer = fs.readFileSync(tmpPdf);
    return pdfBuffer;
  } finally {
    try {
      if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);
      if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
    } catch {
      // Ignore cleanup errors
    }
  }
}
