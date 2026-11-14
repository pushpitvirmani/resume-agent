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

// Find Chrome or Edge executable on the system
function findBrowserExecutable(): string {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.CHROME_BIN,
    process.env.PUPPETEER_EXECUTABLE_PATH,
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback to binary names in PATH
  return 'chrome';
}

// Build clean, professional, ATS-compliant HTML for 1-page PDF
export function renderResumeHtml(data: ExportResumeData): string {
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(data.name)} - Resume</title>
  <style>
    @page {
      size: letter portrait;
      margin: 9mm 11mm 9mm 11mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.38;
      font-size: 9.5pt;
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
      max-width: 800px;
      margin: 0 auto;
    }
    /* Header */
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 7px;
      margin-bottom: 9px;
    }
    .candidate-name {
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #0f172a;
      margin: 0 0 3px 0;
      line-height: 1.1;
    }
    .contact-bar {
      font-size: 8.5pt;
      color: #334155;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 5px 10px;
    }
    .contact-bar span:not(:last-child)::after {
      content: " •";
      margin-left: 8px;
      color: #94a3b8;
    }
    /* Section Headings */
    .section-title {
      font-size: 10pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #0f172a;
      border-bottom: 1px solid #94a3b8;
      padding-bottom: 2px;
      margin-top: 9px;
      margin-bottom: 5px;
      page-break-after: avoid;
      break-after: avoid;
    }
    /* Summary */
    .summary-text {
      font-size: 8.8pt;
      color: #1e293b;
      margin: 0 0 7px 0;
      line-height: 1.36;
      text-align: justify;
    }
    /* Experience */
    .exp-item {
      margin-bottom: 6px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 9.5pt;
    }
    .role-title {
      font-weight: 700;
      color: #0f172a;
    }
    .date-badge {
      font-size: 8.2pt;
      font-weight: 600;
      color: #475569;
    }
    .company-subheader {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 8.8pt;
      font-style: italic;
      color: #334155;
      margin-bottom: 2px;
    }
    .company-name {
      font-weight: 600;
      color: #1e293b;
    }
    .location-text {
      font-size: 8pt;
      color: #64748b;
      font-style: normal;
    }
    /* Bullet Points */
    .bullet-list {
      margin: 1px 0 5px 16px;
      padding: 0;
    }
    .bullet-list li {
      font-size: 8.8pt;
      color: #1e293b;
      margin-bottom: 2px;
      line-height: 1.34;
    }
    .metric-bold {
      font-weight: 700;
      color: #000000;
    }
    /* Skills */
    .skill-row {
      font-size: 8.7pt;
      margin-bottom: 2.5px;
      line-height: 1.32;
    }
    .skill-category {
      font-weight: 700;
      color: #0f172a;
    }
    .skill-items {
      color: #1e293b;
    }
    /* Education */
    .edu-item {
      margin-bottom: 4px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .edu-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 9pt;
      font-weight: 700;
      color: #0f172a;
    }
    .institution-name {
      font-weight: 700;
    }
    .degree-text {
      font-size: 8.5pt;
      color: #334155;
    }
    /* Certifications */
    .cert-item {
      font-size: 8.5pt;
      color: #1e293b;
      margin-bottom: 2px;
    }
  </style>
</head>
<body>
  <div class="resume-container">
    <!-- Header -->
    <header class="header">
      <h1 class="candidate-name">${escapeHtml(data.name)}</h1>
      <div class="contact-bar">
        ${contactParts.map((p) => `<span>${p}</span>`).join('')}
      </div>
    </header>

    <!-- Professional Summary -->
    ${
      data.summary
        ? `
      <section>
        <div class="section-title">Professional Summary</div>
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
        <div class="section-title">Core Competencies &amp; Skills</div>
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
        <div class="section-title">Professional Experience</div>
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
        <div class="section-title">Key Projects &amp; Initiatives</div>
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
        <div class="section-title">Education</div>
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
        <div class="section-title">Certifications</div>
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
export async function generateResumePdf(data: ExportResumeData): Promise<Buffer> {
  const browserPath = findBrowserExecutable();
  const htmlContent = renderResumeHtml(data);

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
