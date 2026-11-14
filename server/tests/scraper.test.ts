import { prisma } from '../src/db.js';
import { scrapeLinkedInJobs } from '../src/services/scraper.js';

async function runScraperTest() {
  console.log('--- STARTING SCRAPER ENGINE TESTS ---');

  // 1. Test scrape execution with target parameters
  console.log('[Test 1] Scraping targeted PM jobs (maxJobs: 3)...');
  const result = await scrapeLinkedInJobs({
    keywords: 'Product Manager',
    location: 'Remote',
    maxJobs: 3,
    datePreset: 'past_week',
    onProgress: (p) => {
      console.log(`  > Progress: ${p.current}/${p.total} - ${p.title} at ${p.company}`);
    },
  });

  console.log(`[Test 1] Result summary: scraped=${result.scraped}, inserted=${result.inserted}, updated=${result.updated}`);
  if (result.scraped === 0) {
    throw new Error('Test failed: Expected at least 1 job to be returned');
  }

  // 2. Validate extracted structure
  console.log('[Test 2] Validating job fields...');
  for (const job of result.jobs) {
    if (!job.title || !job.company || !job.url || !job.description) {
      throw new Error(`Job missing essential fields: ${JSON.stringify(job)}`);
    }
    console.log(`  ✓ Validated: "${job.title}" at "${job.company}" (${job.url.substring(0, 45)}...)`);
  }

  // 3. Verify SQLite persistence and retrieval
  console.log('[Test 3] Verifying database persistence...');
  const dbJobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log(`  Found ${dbJobs.length} jobs in SQLite DB`);
  if (dbJobs.length === 0) {
    throw new Error('No jobs found in database after scraping');
  }

  // 4. Test deduplication: running again with the same URLs should not throw or duplicate
  console.log('[Test 4] Verifying deduplication behavior...');
  const firstJob = result.jobs[0];
  const countBefore = await prisma.job.count({ where: { url: firstJob.url } });
  
  // Scrape again with exact same single URL via duplicate attempt
  await scrapeLinkedInJobs({
    keywords: 'Product Manager',
    location: 'Remote',
    maxJobs: 1,
  });

  const countAfter = await prisma.job.count({ where: { url: firstJob.url } });
  if (countAfter !== countBefore) {
    throw new Error(`Deduplication failed: URL count changed from ${countBefore} to ${countAfter}`);
  }
  console.log(`  ✓ Deduplication verified: URL count remained strictly ${countAfter}`);

  console.log('--- ALL SCRAPER TESTS PASSED SUCCESSFULLY ---');
  process.exit(0);
}

runScraperTest().catch((err) => {
  console.error('Scraper test failed with error:', err);
  process.exit(1);
});
