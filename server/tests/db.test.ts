import prisma from '../src/db.js';

async function verify() {
  const resume = await prisma.masterResume.findFirst();
  const settings = await prisma.appSettings.findFirst();
  const guidelines = await prisma.resumeGuideline.findMany();

  console.log('✓ Master Resume:', resume?.name);
  console.log('✓ Settings maxScrapeJobs:', settings?.maxScrapeJobs);
  console.log('✓ Guidelines count:', guidelines.length);

  if (!resume || resume.name !== 'Pushpit Virmani') {
    throw new Error('Master resume not found or name mismatch');
  }
  if (!settings || settings.maxScrapeJobs !== 25) {
    throw new Error('AppSettings not seeded correctly');
  }
  if (guidelines.length < 3) {
    throw new Error('Baseline guidelines missing');
  }

  console.log('ALL PERSISTENCE CHECKS PASSED!');
  await prisma.$disconnect();
}

verify().catch((e) => {
  console.error(e);
  process.exit(1);
});
