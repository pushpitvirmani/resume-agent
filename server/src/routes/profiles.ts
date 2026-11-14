import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

const router = Router();

const CreateProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required'),
  description: z.string().optional(),
});

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

// GET /api/profiles - List all profiles
router.get('/', async (req, res) => {
  try {
    const profiles = await prisma.profile.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    res.json({ ok: true, profiles });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to list profiles' });
  }
});

// POST /api/profiles - Create new profile (cloning Pushpit Virmani's master resume as default template)
router.post('/', async (req, res) => {
  try {
    const parse = CreateProfileSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ ok: false, error: 'Invalid profile data', details: parse.error.errors });
    }

    const newProfile = await prisma.profile.create({
      data: {
        name: parse.data.name,
        description: parse.data.description || '',
        isDefault: false,
      },
    });

    // Requirement: "Default resume will be pushpit's resume for all profiles"
    // Fetch default master resume
    const defaultMaster = await prisma.masterResume.findFirst({
      where: { profileId: 'default' },
    }) || await prisma.masterResume.findFirst({ orderBy: { createdAt: 'asc' } });

    if (defaultMaster) {
      await prisma.masterResume.create({
        data: {
          profileId: newProfile.id,
          name: defaultMaster.name,
          email: defaultMaster.email,
          phone: defaultMaster.phone,
          location: defaultMaster.location,
          linkedinUrl: defaultMaster.linkedinUrl,
          portfolioUrl: defaultMaster.portfolioUrl,
          summary: defaultMaster.summary,
          experience: defaultMaster.experience,
          projects: defaultMaster.projects,
          skills: defaultMaster.skills,
          education: defaultMaster.education,
          certifications: defaultMaster.certifications,
          styling: defaultMaster.styling,
        },
      });
    }

    // Clone default guidelines to new profile so it starts with initial rules, but remains 100% independent
    const defaultGuidelines = await prisma.resumeGuideline.findMany({
      where: { profileId: 'default' },
    });
    for (const g of defaultGuidelines) {
      await prisma.resumeGuideline.create({
        data: {
          profileId: newProfile.id,
          rule: g.rule,
          category: g.category,
          active: g.active,
        },
      });
    }

    res.status(201).json({ ok: true, profile: newProfile });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to create profile' });
  }
});

// GET /api/profiles/:id - Get specific profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await prisma.profile.findUnique({ where: { id } });
    if (!profile) return res.status(404).json({ ok: false, error: 'Profile not found' });
    res.json({ ok: true, profile });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to fetch profile' });
  }
});

// PUT /api/profiles/:id - Update profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parse = UpdateProfileSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ ok: false, error: 'Invalid profile update' });
    }

    const updated = await prisma.profile.update({
      where: { id },
      data: parse.data,
    });
    res.json({ ok: true, profile: updated });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to update profile' });
  }
});

// DELETE /api/profiles/:id - Delete non-default profile
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await prisma.profile.findUnique({ where: { id } });
    if (!profile) return res.status(404).json({ ok: false, error: 'Profile not found' });
    if (profile.isDefault || profile.id === 'default') {
      return res.status(400).json({ ok: false, error: 'Cannot delete the default profile' });
    }

    // Delete associated master resume and guidelines
    await prisma.masterResume.deleteMany({ where: { profileId: id } });
    await prisma.resumeGuideline.deleteMany({ where: { profileId: id } });
    await prisma.profile.delete({ where: { id } });

    res.json({ ok: true, message: 'Profile deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to delete profile' });
  }
});

export default router;
