import { Router } from 'express';
import { createRequire } from 'module';
import prisma from '../db.js';
import { generateResumeDocx, ExportResumeData } from '../services/docxExport.js';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

const router = Router();

// Helper to sanitize filename
function sanitizeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}

// Convert DB MasterResume or TailoredResume into ExportResumeData
async function resolveExportData(
  body: { resumeData?: any; jobId?: string; profileId?: string }
): Promise<{ data: ExportResumeData; filenameBase: string }> {
  if (body.resumeData) {
    const r = body.resumeData;
    const name = r.name || 'Pushpit Virmani';
    return {
      data: {
        name,
        email: r.email || '',
        phone: r.phone || '',
        location: r.location || '',
        linkedinUrl: r.linkedinUrl || '',
        portfolioUrl: r.portfolioUrl || '',
        summary: r.summary || '',
        experience: r.experience || [],
        skills: r.skills || [],
        education: r.education || [],
        projects: r.projects || [],
        certifications: r.certifications || []
      },
      filenameBase: `${sanitizeFilename(name)}_Resume`
    };
  }

  if (body.jobId) {
    const job = await prisma.job.findUnique({
      where: { id: body.jobId }
    });

    if (!job) {
      throw new Error(`Job with ID ${body.jobId} not found`);
    }

    const tailoredResume = await prisma.tailoredResume.findFirst({
      where: { jobId: body.jobId }
    });

    const master = await prisma.masterResume.findFirst({
      where: { profileId: body.profileId || 'default' }
    });

    const candidateName = master?.name || 'Pushpit Virmani';

    if (tailoredResume) {
      const content = JSON.parse(tailoredResume.content);
      const experience = (content.experience || []).map((exp: any) => ({
        company: exp.company,
        role: exp.role,
        location: exp.location || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        bullets: (exp.bullets || []).map((b: any) =>
          typeof b === 'string' ? b : b.tailored || b.original
        )
      }));

      return {
        data: {
          name: candidateName,
          email: master?.email || '',
          phone: master?.phone || '',
          location: master?.location || '',
          linkedinUrl: master?.linkedinUrl || '',
          portfolioUrl: master?.portfolioUrl || '',
          summary: content.summary || master?.summary || '',
          experience,
          skills: content.skills || (master?.skills ? JSON.parse(master.skills) : []),
          education: master?.education ? JSON.parse(master.education) : [],
          projects: master?.projects ? JSON.parse(master.projects) : [],
          certifications: master?.certifications ? JSON.parse(master.certifications) : []
        },
        filenameBase: `${sanitizeFilename(candidateName)}_${sanitizeFilename(job.company)}_Resume`
      };
    } else if (master) {
      return {
        data: {
          name: candidateName,
          email: master.email,
          phone: master.phone || '',
          location: master.location || '',
          linkedinUrl: master.linkedinUrl || '',
          portfolioUrl: master.portfolioUrl || '',
          summary: master.summary,
          experience: master.experience ? JSON.parse(master.experience) : [],
          skills: master.skills ? JSON.parse(master.skills) : [],
          education: master.education ? JSON.parse(master.education) : [],
          projects: master.projects ? JSON.parse(master.projects) : [],
          certifications: master.certifications ? JSON.parse(master.certifications) : []
        },
        filenameBase: `${sanitizeFilename(candidateName)}_${sanitizeFilename(job.company)}_Resume`
      };
    }
  }

  // Fallback to default master resume or specified profileId
  const profileIdToUse = body.profileId || 'default';
  let defaultMaster = await prisma.masterResume.findFirst({
    where: { profileId: profileIdToUse }
  });

  if (!defaultMaster && profileIdToUse !== 'default') {
    defaultMaster = await prisma.masterResume.findFirst({
      where: { profileId: 'default' }
    });
  }

  if (!defaultMaster) {
    throw new Error('No master resume data available');
  }

  const profileObj = profileIdToUse !== 'default'
    ? await prisma.profile.findUnique({ where: { id: profileIdToUse } })
    : null;
  const profileSuffix = profileObj?.name ? `_${sanitizeFilename(profileObj.name)}` : '';

  return {
    data: {
      name: defaultMaster.name,
      email: defaultMaster.email,
      phone: defaultMaster.phone || '',
      location: defaultMaster.location || '',
      linkedinUrl: defaultMaster.linkedinUrl || '',
      portfolioUrl: defaultMaster.portfolioUrl || '',
      summary: defaultMaster.summary,
      experience: defaultMaster.experience ? JSON.parse(defaultMaster.experience) : [],
      skills: defaultMaster.skills ? JSON.parse(defaultMaster.skills) : [],
      education: defaultMaster.education ? JSON.parse(defaultMaster.education) : [],
      projects: defaultMaster.projects ? JSON.parse(defaultMaster.projects) : [],
      certifications: defaultMaster.certifications ? JSON.parse(defaultMaster.certifications) : []
    },
    filenameBase: `${sanitizeFilename(defaultMaster.name)}${profileSuffix}_Resume`
  };
}

// POST /api/export/docx - Export Single Resume as .docx
router.post('/docx', async (req, res) => {
  try {
    const { data, filenameBase } = await resolveExportData(req.body);
    const buffer = await generateResumeDocx(data);

    const filename = `${filenameBase}.docx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    console.error('Error generating DOCX export:', error);
    res.status(500).json({ error: error.message || 'Failed to generate DOCX export' });
  }
});

// POST /api/export/batch - Export Multiple Resumes into a single .zip
router.post('/batch', async (req, res) => {
  try {
    const { jobIds, format = 'docx' } = req.body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ error: 'jobIds array is required and must not be empty' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Tailored_Resumes_Batch_${Date.now()}.zip"`
    );

    archive.pipe(res);

    archive.on('error', (err: any) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });

    for (let i = 0; i < jobIds.length; i++) {
      const jId = jobIds[i];
      try {
        const { data, filenameBase } = await resolveExportData({ jobId: jId });
        const docxBuffer = await generateResumeDocx(data);
        const entryName = `${String(i + 1).padStart(2, '0')}_${filenameBase}.docx`;
        archive.append(docxBuffer, { name: entryName });
      } catch (err) {
        console.warn(`Skipping job ${jId} in batch export due to error:`, err);
      }
    }

    await archive.finalize();
  } catch (error: any) {
    console.error('Error in batch export:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to generate batch export' });
    }
  }
});

export default router;
