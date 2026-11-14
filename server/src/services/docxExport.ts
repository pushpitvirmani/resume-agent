import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  TabStopType,
  TabStopPosition,
  convertInchesToTwip
} from 'docx';

export interface ExportResumeData {
  name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  summary: string;
  experience: Array<{
    company: string;
    role: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    bullets: string[];
  }>;
  skills: Array<{
    category: string;
    skills: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    graduationYear?: string;
    honors?: string;
  }>;
  projects?: Array<{
    title: string;
    role?: string;
    tools?: string[];
    link?: string;
    bullets: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    year?: string;
  }>;
}

// Helper to parse markdown **bold** phrases into docx TextRuns
function parseFormattedRuns(text: string, defaultSize: number = 20): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({
        text: part.slice(2, -2),
        bold: true,
        size: defaultSize,
        font: 'Calibri'
      });
    }
    return new TextRun({
      text: part,
      bold: false,
      size: defaultSize,
      font: 'Calibri'
    });
  });
}

// Section Header with ATS-compliant bottom border
function createSectionHeader(title: string): Paragraph {
  // Tracked uppercase header e.g. "E X P E R I E N C E"
  const spacedTitle = title.toUpperCase().split('').join(' ');
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    border: {
      bottom: {
        color: '333333',
        space: 3,
        style: BorderStyle.SINGLE,
        size: 6
      }
    },
    children: [
      new TextRun({
        text: spacedTitle,
        bold: true,
        size: 21, // ~10.5pt
        font: 'Calibri',
        color: '111827'
      })
    ]
  });
}

export async function generateResumeDocx(data: ExportResumeData): Promise<Buffer> {
  const paragraphs: Paragraph[] = [];

  // 1. Candidate Name (Centered, tracked uppercase, bold)
  const candidateName = data.name
    ? data.name.toUpperCase().split('').join(' ')
    : 'P U S H P I T   V I R M A N I';

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: candidateName,
          bold: true,
          size: 28, // 14pt
          font: 'Calibri',
          color: '0F172A'
        })
      ]
    })
  );

  // 2. Contact details line
  const contactParts: string[] = [];
  if (data.location) contactParts.push(data.location);
  if (data.email) contactParts.push(data.email);
  if (data.phone) contactParts.push(data.phone);
  if (data.linkedinUrl) contactParts.push(data.linkedinUrl);
  if (data.portfolioUrl) contactParts.push(data.portfolioUrl);

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 180 },
      children: [
        new TextRun({
          text: contactParts.join('  •  '),
          size: 19, // ~9.5pt
          font: 'Calibri',
          color: '475569'
        })
      ]
    })
  );

  // 3. Summary Section
  if (data.summary && data.summary.trim()) {
    paragraphs.push(createSectionHeader('Professional Summary'));
    paragraphs.push(
      new Paragraph({
        spacing: { before: 60, after: 120, line: 276 },
        children: parseFormattedRuns(data.summary, 20)
      })
    );
  }

  // 4. Experience Section
  if (data.experience && data.experience.length > 0) {
    paragraphs.push(createSectionHeader('Work Experience'));

    for (const exp of data.experience) {
      // Line 1: Role (Bold) & Dates (Right aligned)
      const dateText = [exp.startDate, exp.endDate].filter(Boolean).join(' - ');
      paragraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 20 },
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: 10500 // Tab stop to right margin
            }
          ],
          children: [
            new TextRun({
              text: exp.role || 'Product Manager',
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '0F172A'
            }),
            new TextRun({
              children: ['\t', dateText],
              bold: false,
              size: 20,
              font: 'Calibri',
              color: '475569'
            })
          ]
        })
      );

      // Line 2: Company & Location
      paragraphs.push(
        new Paragraph({
          spacing: { before: 0, after: 60 },
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: 10500
            }
          ],
          children: [
            new TextRun({
              text: exp.company || '',
              bold: true,
              italics: true,
              size: 20,
              font: 'Calibri',
              color: '334155'
            }),
            new TextRun({
              children: ['\t', exp.location || ''],
              size: 19,
              font: 'Calibri',
              color: '64748B'
            })
          ]
        })
      );

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        for (const bullet of exp.bullets) {
          paragraphs.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 30, after: 40, line: 260 },
              children: parseFormattedRuns(bullet, 20)
            })
          );
        }
      }
    }
  }

  // 5. Skills Section
  if (data.skills && data.skills.length > 0) {
    paragraphs.push(createSectionHeader('Technical & Product Skills'));

    for (const cat of data.skills) {
      const skillsStr = Array.isArray(cat.skills) ? cat.skills.join('  •  ') : '';
      paragraphs.push(
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: `${cat.category}: `,
              bold: true,
              size: 20,
              font: 'Calibri',
              color: '1E293B'
            }),
            new TextRun({
              text: skillsStr,
              size: 20,
              font: 'Calibri',
              color: '334155'
            })
          ]
        })
      );
    }
  }

  // 6. Education Section
  if (data.education && data.education.length > 0) {
    paragraphs.push(createSectionHeader('Education'));

    for (const edu of data.education) {
      const degreeText = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
      paragraphs.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: 10500
            }
          ],
          children: [
            new TextRun({
              text: degreeText || 'Degree',
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '0F172A'
            }),
            new TextRun({
              children: ['\t', edu.graduationYear || ''],
              size: 20,
              font: 'Calibri',
              color: '475569'
            })
          ]
        })
      );

      paragraphs.push(
        new Paragraph({
          spacing: { before: 0, after: 60 },
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: 10500
            }
          ],
          children: [
            new TextRun({
              text: edu.institution,
              italics: true,
              size: 20,
              font: 'Calibri',
              color: '334155'
            }),
            new TextRun({
              children: ['\t', edu.honors || ''],
              size: 19,
              font: 'Calibri',
              color: '64748B'
            })
          ]
        })
      );
    }
  }

  // 7. Projects Section (if present)
  if (data.projects && data.projects.length > 0) {
    paragraphs.push(createSectionHeader('Key Projects & Strategic Initiatives'));

    for (const proj of data.projects) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          children: [
            new TextRun({
              text: proj.title,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '0F172A'
            }),
            proj.role
              ? new TextRun({
                  text: ` — ${proj.role}`,
                  italics: true,
                  size: 20,
                  font: 'Calibri',
                  color: '475569'
                })
              : new TextRun({ text: '' })
          ]
        })
      );

      if (proj.bullets && proj.bullets.length > 0) {
        for (const bullet of proj.bullets) {
          paragraphs.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 20, after: 30 },
              children: parseFormattedRuns(bullet, 20)
            })
          );
        }
      }
    }
  }

  // Build Document with 0.5 in margins (720 dxa)
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5)
            }
          }
        },
        children: paragraphs
      }
    ]
  });

  return await Packer.toBuffer(doc);
}
