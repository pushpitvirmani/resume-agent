import { Router } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import prisma from '../db.js';
import { resumeProfileSchema, MasterResumeProfile } from '../types/resume.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

function formatResumeResponse(record: any): MasterResumeProfile {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone || '',
    location: record.location || '',
    linkedinUrl: record.linkedinUrl || '',
    portfolioUrl: record.portfolioUrl || '',
    summary: record.summary || '',
    experience: record.experience ? JSON.parse(record.experience) : [],
    projects: record.projects ? JSON.parse(record.projects) : [],
    skills: record.skills ? JSON.parse(record.skills) : [],
    education: record.education ? JSON.parse(record.education) : [],
    certifications: record.certifications ? JSON.parse(record.certifications) : [],
    createdAt: record.createdAt?.toISOString(),
    updatedAt: record.updatedAt?.toISOString()
  };
}

// GET /api/resume
router.get('/', async (req, res) => {
  try {
    let resume = await prisma.masterResume.findFirst();
    if (!resume) {
      // Seed if empty
      const masterResumePath = path.resolve(__dirname, '../../../.gsd/MASTER_RESUME.json');
      let defaultData: any = {};
      if (fs.existsSync(masterResumePath)) {
        defaultData = JSON.parse(fs.readFileSync(masterResumePath, 'utf8'));
      }
      resume = await prisma.masterResume.create({
        data: {
          name: defaultData.name || 'Pushpit Virmani',
          email: defaultData.email || 'pushpitvirmani@gmail.com',
          phone: defaultData.phone || '(+91) 7895634749',
          location: defaultData.location || 'Gurgaon, India',
          linkedinUrl: defaultData.linkedinUrl || 'https://www.linkedin.com/in/pushpit-virmani/',
          portfolioUrl: defaultData.portfolioUrl || '',
          summary: defaultData.summary || '',
          experience: JSON.stringify(defaultData.experience || []),
          projects: JSON.stringify(defaultData.projects || []),
          skills: JSON.stringify(defaultData.skills || []),
          education: JSON.stringify(defaultData.education || []),
          certifications: JSON.stringify(defaultData.certifications || []),
        }
      });
    }
    res.json({ profile: formatResumeResponse(resume) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/resume
router.put('/', async (req, res) => {
  try {
    const parseResult = resumeProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten()
      });
    }

    const data = parseResult.data;
    const existing = await prisma.masterResume.findFirst();

    let updated;
    if (existing) {
      updated = await prisma.masterResume.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          location: data.location,
          linkedinUrl: data.linkedinUrl,
          portfolioUrl: data.portfolioUrl,
          summary: data.summary,
          experience: JSON.stringify(data.experience),
          projects: JSON.stringify(data.projects),
          skills: JSON.stringify(data.skills),
          education: JSON.stringify(data.education),
          certifications: JSON.stringify(data.certifications || []),
        }
      });
    } else {
      updated = await prisma.masterResume.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          location: data.location,
          linkedinUrl: data.linkedinUrl,
          portfolioUrl: data.portfolioUrl,
          summary: data.summary,
          experience: JSON.stringify(data.experience),
          projects: JSON.stringify(data.projects),
          skills: JSON.stringify(data.skills),
          education: JSON.stringify(data.education),
          certifications: JSON.stringify(data.certifications || []),
        }
      });
    }

    res.json({
      profile: formatResumeResponse(updated),
      message: 'Master resume updated successfully'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resume/seed
router.post('/seed', async (req, res) => {
  try {
    const masterResumePath = path.resolve(__dirname, '../../../.gsd/MASTER_RESUME.json');
    if (!fs.existsSync(masterResumePath)) {
      return res.status(404).json({ error: '.gsd/MASTER_RESUME.json not found' });
    }
    const defaultData = JSON.parse(fs.readFileSync(masterResumePath, 'utf8'));
    const existing = await prisma.masterResume.findFirst();

    let seeded;
    if (existing) {
      seeded = await prisma.masterResume.update({
        where: { id: existing.id },
        data: {
          name: defaultData.name,
          email: defaultData.email,
          phone: defaultData.phone || '',
          location: defaultData.location || '',
          linkedinUrl: defaultData.linkedinUrl || '',
          portfolioUrl: defaultData.portfolioUrl || '',
          summary: defaultData.summary || '',
          experience: JSON.stringify(defaultData.experience || []),
          projects: JSON.stringify(defaultData.projects || []),
          skills: JSON.stringify(defaultData.skills || []),
          education: JSON.stringify(defaultData.education || []),
          certifications: JSON.stringify(defaultData.certifications || []),
        }
      });
    } else {
      seeded = await prisma.masterResume.create({
        data: {
          name: defaultData.name,
          email: defaultData.email,
          phone: defaultData.phone || '',
          location: defaultData.location || '',
          linkedinUrl: defaultData.linkedinUrl || '',
          portfolioUrl: defaultData.portfolioUrl || '',
          summary: defaultData.summary || '',
          experience: JSON.stringify(defaultData.experience || []),
          projects: JSON.stringify(defaultData.projects || []),
          skills: JSON.stringify(defaultData.skills || []),
          education: JSON.stringify(defaultData.education || []),
          certifications: JSON.stringify(defaultData.certifications || []),
        }
      });
    }

    res.json({
      profile: formatResumeResponse(seeded),
      message: 'Master resume reset to default profile'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resume/upload
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Expected field "resume"' });
    }

    let extractedText = '';
    const mime = req.file.mimetype;
    const filename = req.file.originalname.toLowerCase();

    if (mime === 'application/pdf' || filename.endsWith('.pdf')) {
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text;
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filename.endsWith('.docx')
    ) {
      const docxData = await mammoth.extractRawText({ buffer: req.file.buffer });
      extractedText = docxData.value;
    } else {
      extractedText = req.file.buffer.toString('utf8');
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'Could not extract text from uploaded document' });
    }

    // Heuristic extraction for quick population
    const lines = extractedText.split('\n').map((l) => l.trim()).filter(Boolean);
    const name = lines[0] || 'Imported Candidate';
    const emailMatch = extractedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : 'candidate@example.com';
    const phoneMatch = extractedText.match(/(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}|\+91[ -]?\d{10}/);
    const phone = phoneMatch ? phoneMatch[0] : '';
    const linkedinMatch = extractedText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/);
    const linkedinUrl = linkedinMatch ? `https://${linkedinMatch[0]}` : '';

    const existing = await prisma.masterResume.findFirst();
    const currentProfile: MasterResumeProfile = existing ? formatResumeResponse(existing) : {
      name,
      email,
      summary: '',
      experience: [],
      projects: [],
      skills: [],
      education: []
    };

    const updatedProfile: MasterResumeProfile = {
      ...currentProfile,
      name: name.length < 50 ? name : currentProfile.name,
      email,
      phone: phone || currentProfile.phone,
      linkedinUrl: linkedinUrl || currentProfile.linkedinUrl,
      summary: currentProfile.summary || extractedText.slice(0, 400)
    };

    let saved;
    if (existing) {
      saved = await prisma.masterResume.update({
        where: { id: existing.id },
        data: {
          name: updatedProfile.name,
          email: updatedProfile.email,
          phone: updatedProfile.phone,
          location: updatedProfile.location,
          linkedinUrl: updatedProfile.linkedinUrl,
          portfolioUrl: updatedProfile.portfolioUrl,
          summary: updatedProfile.summary,
          experience: JSON.stringify(updatedProfile.experience),
          projects: JSON.stringify(updatedProfile.projects),
          skills: JSON.stringify(updatedProfile.skills),
          education: JSON.stringify(updatedProfile.education),
          certifications: JSON.stringify(updatedProfile.certifications || []),
        }
      });
    } else {
      saved = await prisma.masterResume.create({
        data: {
          name: updatedProfile.name,
          email: updatedProfile.email,
          phone: updatedProfile.phone,
          location: updatedProfile.location,
          linkedinUrl: updatedProfile.linkedinUrl,
          portfolioUrl: updatedProfile.portfolioUrl,
          summary: updatedProfile.summary,
          experience: JSON.stringify(updatedProfile.experience),
          projects: JSON.stringify(updatedProfile.projects),
          skills: JSON.stringify(updatedProfile.skills),
          education: JSON.stringify(updatedProfile.education),
          certifications: JSON.stringify(updatedProfile.certifications || []),
        }
      });
    }

    res.json({
      profile: formatResumeResponse(saved),
      message: 'Resume parsed and uploaded successfully',
      extractedTextLength: extractedText.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
