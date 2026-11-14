import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Pushpit Virmani profile and baseline settings...');

  // 1. Seed or update Master Resume
  const masterResumePath = path.resolve(__dirname, '../../.gsd/MASTER_RESUME.json');
  let masterData: any;

  if (fs.existsSync(masterResumePath)) {
    masterData = JSON.parse(fs.readFileSync(masterResumePath, 'utf8'));
  } else {
    masterData = {
      name: 'Pushpit Virmani',
      title: 'Senior Product Manager',
      email: 'pushpitvirmani@gmail.com',
      phone: '(+91) 7895634749',
      location: 'Gurgaon, India',
      linkedinUrl: 'https://www.linkedin.com/in/pushpit-virmani/',
      summary: 'Result-driven Senior Product Manager with 5+ years of experience in the Tech and AI industry.',
      experience: [],
      projects: [],
      skills: [],
      education: []
    };
  }

  const existingResume = await prisma.masterResume.findFirst();
  if (!existingResume) {
    await prisma.masterResume.create({
      data: {
        name: masterData.name,
        email: masterData.email,
        phone: masterData.phone || '',
        location: masterData.location || '',
        linkedinUrl: masterData.linkedinUrl || '',
        portfolioUrl: masterData.portfolioUrl || '',
        summary: masterData.summary || '',
        experience: JSON.stringify(masterData.experience || []),
        projects: JSON.stringify(masterData.projects || []),
        skills: JSON.stringify(masterData.skills || []),
        education: JSON.stringify(masterData.education || []),
        certifications: JSON.stringify(masterData.certifications || []),
      }
    });
    console.log('✓ Master Resume created for Pushpit Virmani');
  } else {
    console.log('ℹ Master Resume already exists');
  }

  // 2. Seed AppSettings
  await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      activeAiProvider: 'gemini',
      dailyScheduleCron: '0 9 * * *',
      maxScrapeJobs: 25,
      dateFilterPreset: 'past_week',
      keywords: 'Product Manager',
      location: 'Remote',
      headless: true
    }
  });
  console.log('✓ Default AppSettings seeded');

  // 3. Seed Baseline Guidelines
  const baselineGuidelines = [
    {
      rule: 'Always quantify PM metrics with business impact, revenue, or efficiency percentages',
      category: 'metrics'
    },
    {
      rule: 'Keep bullet points concise and initiate with strong active verbs',
      category: 'style'
    },
    {
      rule: 'Highlight AI agent architecture, LLM evaluation, and prompt engineering in AI-related roles',
      category: 'keywords'
    }
  ];

  for (const g of baselineGuidelines) {
    const exists = await prisma.resumeGuideline.findFirst({ where: { rule: g.rule } });
    if (!exists) {
      await prisma.resumeGuideline.create({
        data: {
          rule: g.rule,
          category: g.category,
          active: true
        }
      });
    }
  }
  console.log('✓ Baseline resume guidelines seeded');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
