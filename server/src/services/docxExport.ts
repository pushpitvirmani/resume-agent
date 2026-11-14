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
function parseFormattedRuns(text: string, defaultSize: number = 20, font: string = 'Calibri'): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({
        text: part.slice(2, -2),
        bold: true,
        size: defaultSize,
        font
      });
    }
    return new TextRun({
      text: part,
      bold: false,
      size: defaultSize,
      font
    });
  });
}

// Section Header with ATS-compliant bottom border
function createSectionHeader(
  title: string,
  font: string = 'Calibri',
  size: number = 21,
  accentColor: string = '0F172A',
  templateId: string = 'harshit',
  before: number = 180,
  after: number = 80
): Paragraph {
  let headerText = title.toUpperCase();
  if (templateId === 'harshit') {
    headerText = title.toUpperCase().split('').join(' ');
  } else if (templateId === 'aispecialist') {
    headerText = `> ${title.toUpperCase()}`;
  }

  return new Paragraph({
    spacing: { before, after },
    border: {
      bottom: {
        color: accentColor,
        space: 3,
        style: BorderStyle.SINGLE,
        size: 6
      }
    },
    children: [
      new TextRun({
        text: headerText,
        bold: true,
        size,
        font,
        color: accentColor
      })
    ]
  });
}

export async function generateResumeDocx(data: ExportResumeData, styling?: any): Promise<Buffer> {
  const templateId = (styling?.templateId as string) || 'harshit';
  const options = styling?.options || {};

  // Font mapping
  const fontFamilyChoice = options.fontFamily || (templateId === 'ivyleague' ? 'Garamond' : 'Inter');
  const docxFont = (() => {
    if (fontFamilyChoice === 'Garamond') return 'Garamond';
    if (fontFamilyChoice === 'Georgia' || fontFamilyChoice === 'Playfair Display') return 'Georgia';
    if (fontFamilyChoice === 'JetBrains Mono') return 'Consolas';
    if (fontFamilyChoice === 'Roboto') return 'Arial';
    return 'Calibri';
  })();

  // Accent Color (hex without #)
  const defaultAccents: Record<string, string> = {
    harshit: '0F172A',
    minimalist: '4F46E5',
    executive: '1E3A8A',
    ivyleague: '1C1917',
    consulting: '0369A1',
    aispecialist: '6366F1',
    growth: '047857',
    enterprise: '1E40AF',
    compact: 'EA580C',
    nordic: '0D9488',
  };
  const rawAccent = options.accentColor ? options.accentColor.replace('#', '').toUpperCase() : (defaultAccents[templateId] || '0F172A');
  const docxAccent = rawAccent.length === 6 ? rawAccent : '0F172A';

  // Sizing Presets
  const fontSizePreset = options.fontSize || (templateId === 'compact' ? 'compact' : 'standard');
  const bodySize = fontSizePreset === 'compact' ? 18 : fontSizePreset === 'relaxed' ? 22 : 20; // 9pt / 11pt / 10pt
  const roleSize = bodySize + 1;
  const nameSize = fontSizePreset === 'compact' ? 26 : fontSizePreset === 'relaxed' ? 32 : 28; // 13pt / 16pt / 14pt
  const headerSize = bodySize + 1;

  // Spacing Presets
  const spacingPreset = options.spacing || (templateId === 'compact' ? 'compact' : 'standard');
  const lineSpacing = spacingPreset === 'compact' ? 240 : spacingPreset === 'roomy' ? 320 : 270;
  const sectionBefore = spacingPreset === 'compact' ? 120 : spacingPreset === 'roomy' ? 240 : 180;
  const sectionAfter = spacingPreset === 'compact' ? 60 : spacingPreset === 'roomy' ? 120 : 80;

  // Alignment
  const isLeftAligned = ['minimalist', 'consulting', 'aispecialist', 'growth', 'enterprise', 'nordic'].includes(templateId);
  const headerAlign = isLeftAligned ? AlignmentType.LEFT : AlignmentType.CENTER;
  const contactSeparator = isLeftAligned ? '  |  ' : '  •  ';

  const paragraphs: Paragraph[] = [];

  // 1. Candidate Name
  const candidateName = data.name
    ? templateId === 'harshit'
      ? data.name.toUpperCase().split('').join(' ')
      : data.name
    : 'Pushpit Virmani';

  paragraphs.push(
    new Paragraph({
      alignment: headerAlign,
      spacing: { before: 0, after: 50 },
      children: [
        new TextRun({
          text: candidateName,
          bold: true,
          size: nameSize,
          font: docxFont,
          color: isLeftAligned ? docxAccent : '0F172A'
        })
      ]
    })
  );

  // 2. Contact details line
  const contactParts: string[] = [];
  if (data.location) contactParts.push(data.location);
  if (data.email) contactParts.push(data.email);
  if (data.phone) contactParts.push(data.phone);
  if (data.linkedinUrl) contactParts.push(data.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ''));
  if (data.portfolioUrl) contactParts.push(data.portfolioUrl.replace(/^https?:\/\/(www\.)?/, ''));

  paragraphs.push(
    new Paragraph({
      alignment: headerAlign,
      spacing: { before: 0, after: 150 },
      children: [
        new TextRun({
          text: contactParts.join(contactSeparator),
          size: bodySize - 1,
          font: docxFont,
          color: '475569'
        })
      ]
    })
  );

  // 3. Summary Section
  if (data.summary && data.summary.trim()) {
    paragraphs.push(createSectionHeader('Professional Summary', docxFont, headerSize, docxAccent, templateId, sectionBefore, sectionAfter));
    paragraphs.push(
      new Paragraph({
        spacing: { before: 50, after: 100, line: lineSpacing },
        children: parseFormattedRuns(data.summary, bodySize, docxFont)
      })
    );
  }

  // 4. Experience Section
  if (data.experience && data.experience.length > 0) {
    paragraphs.push(createSectionHeader('Work Experience', docxFont, headerSize, docxAccent, templateId, sectionBefore, sectionAfter));

    for (const exp of data.experience) {
      // Line 1: Role (Bold) & Dates (Right aligned)
      const dateText = [exp.startDate, exp.endDate].filter(Boolean).join(' - ');
      paragraphs.push(
        new Paragraph({
          spacing: { before: 90, after: 20 },
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: 10500
            }
          ],
          children: [
            new TextRun({
              text: exp.role || 'Product Manager',
              bold: true,
              size: roleSize,
              font: docxFont,
              color: '0F172A'
            }),
            new TextRun({
              children: ['\t', dateText],
              bold: false,
              size: bodySize,
              font: docxFont,
              color: '475569'
            })
          ]
        })
      );

      // Line 2: Company & Location
      paragraphs.push(
        new Paragraph({
          spacing: { before: 0, after: 50 },
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
              italics: templateId === 'ivyleague',
              size: bodySize,
              font: docxFont,
              color: '334155'
            }),
            new TextRun({
              children: ['\t', exp.location || ''],
              size: bodySize - 1,
              font: docxFont,
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
              spacing: { before: 20, after: 30, line: lineSpacing },
              children: parseFormattedRuns(bullet, bodySize, docxFont)
            })
          );
        }
      }
    }
  }

  // 5. Skills Section
  if (data.skills && data.skills.length > 0) {
    paragraphs.push(createSectionHeader('Technical & Product Skills', docxFont, headerSize, docxAccent, templateId, sectionBefore, sectionAfter));

    for (const cat of data.skills) {
      const skillsStr = Array.isArray(cat.skills) ? cat.skills.join('  •  ') : '';
      paragraphs.push(
        new Paragraph({
          spacing: { before: 30, after: 30 },
          children: [
            new TextRun({
              text: `${cat.category}: `,
              bold: true,
              size: bodySize,
              font: docxFont,
              color: docxAccent
            }),
            new TextRun({
              text: skillsStr,
              size: bodySize,
              font: docxFont,
              color: '334155'
            })
          ]
        })
      );
    }
  }

  // 6. Education Section
  if (data.education && data.education.length > 0) {
    paragraphs.push(createSectionHeader('Education', docxFont, headerSize, docxAccent, templateId, sectionBefore, sectionAfter));

    for (const edu of data.education) {
      const degreeText = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
      paragraphs.push(
        new Paragraph({
          spacing: { before: 70, after: 20 },
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
              size: roleSize,
              font: docxFont,
              color: '0F172A'
            }),
            new TextRun({
              children: ['\t', edu.graduationYear || ''],
              size: bodySize,
              font: docxFont,
              color: '475569'
            })
          ]
        })
      );

      paragraphs.push(
        new Paragraph({
          spacing: { before: 0, after: 50 },
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
              size: bodySize,
              font: docxFont,
              color: '334155'
            }),
            new TextRun({
              children: ['\t', edu.honors || ''],
              size: bodySize - 1,
              font: docxFont,
              color: '64748B'
            })
          ]
        })
      );
    }
  }

  // 7. Projects Section (if present)
  if (data.projects && data.projects.length > 0) {
    paragraphs.push(createSectionHeader('Key Projects & Strategic Initiatives', docxFont, headerSize, docxAccent, templateId, sectionBefore, sectionAfter));

    for (const proj of data.projects) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 70, after: 20 },
          children: [
            new TextRun({
              text: proj.title,
              bold: true,
              size: roleSize,
              font: docxFont,
              color: '0F172A'
            }),
            proj.role
              ? new TextRun({
                  text: ` — ${proj.role}`,
                  italics: true,
                  size: bodySize,
                  font: docxFont,
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
              spacing: { before: 20, after: 25 },
              children: parseFormattedRuns(bullet, bodySize, docxFont)
            })
          );
        }
      }
    }
  }

  // Build Document with ATS margins
  const marginInches = (templateId === 'compact' || spacingPreset === 'compact') ? 0.38 : 0.5;
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(marginInches),
              right: convertInchesToTwip(marginInches),
              bottom: convertInchesToTwip(marginInches),
              left: convertInchesToTwip(marginInches)
            }
          }
        },
        children: paragraphs
      }
    ]
  });

  return await Packer.toBuffer(doc);
}
