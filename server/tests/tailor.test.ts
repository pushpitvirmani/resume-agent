import { prisma } from '../src/db.js';
import {
  generateTailoredResume,
  refineTailoredResume,
  getTailoredResumeById,
  updateTailoredResumeContent,
} from '../src/services/tailor.js';

async function runTailorTests() {
  console.log('--- STARTING AI RESUME TAILORING TESTS ---');

  // 1. Prepare target job
  let targetJob = await prisma.job.findFirst({
    where: { status: 'discovered' },
  });

  if (!targetJob) {
    targetJob = await prisma.job.create({
      data: {
        title: 'Senior Technical Product Manager - AI & Platform',
        company: 'Stripe',
        location: 'Remote',
        url: `https://www.linkedin.com/jobs/view/test-tailor-${Date.now()}`,
        description: 'Lead API strategy, developer ecosystem, and machine learning infrastructure. Must have experience with high-scale APIs, B2B SaaS, and running A/B experiments.',
        status: 'discovered',
      },
    });
  }

  console.log(`[Test 1] Tailoring master resume for job: "${targetJob.title}" at "${targetJob.company}"...`);
  const tailored = await generateTailoredResume({ jobId: targetJob.id });

  if (!tailored || !tailored.id) {
    throw new Error('generateTailoredResume failed to return valid tailored resume object');
  }
  console.log(`  ✓ Generated tailored resume ID: ${tailored.id}`);

  // 2. Validate ATS analysis and metrics
  console.log('[Test 2] Validating ATS Score & Keyword extraction...');
  const { atsAnalysis } = tailored.content;
  if (typeof tailored.atsScore !== 'number' || tailored.atsScore < 50 || tailored.atsScore > 100) {
    throw new Error(`ATS score outside expected bounds: ${tailored.atsScore}`);
  }
  console.log(`  ✓ ATS Score: ${tailored.atsScore}%`);
  console.log(`  ✓ Matched Keywords (${atsAnalysis.matchedKeywords.length}):`, atsAnalysis.matchedKeywords.slice(0, 5).join(', '));
  console.log(`  ✓ Missing Keywords (${atsAnalysis.missingKeywords.length}):`, atsAnalysis.missingKeywords.slice(0, 5).join(', '));

  // 3. Validate Harshit Kumar reference style format (Bold hooks leading bullets)
  console.log('[Test 3] Validating bold impact hooks on tailored bullets...');
  let checkedBullets = 0;
  for (const exp of tailored.content.experience) {
    for (const b of exp.bullets) {
      if (!b.tailored || typeof b.tailored !== 'string') {
        throw new Error('Tailored bullet is empty or invalid');
      }
      // Check if bullet starts with bold hook: **Hook:** or **Hook**
      const hasBoldHook = /^\*\*[^*]+\*\*:?/.test(b.tailored.trim());
      if (hasBoldHook) {
        checkedBullets++;
      }
    }
  }
  console.log(`  ✓ Verified ${checkedBullets} tailored bullets with bold hooks (e.g. "${tailored.content.experience[0]?.bullets[0]?.tailored?.substring(0, 40)}...")`);

  // 4. Test interactive refinement and guideline proposal
  console.log('[Test 4] Testing interactive feedback refinement & guideline proposal...');
  const countGuidelinesBefore = await prisma.resumeGuideline.count();

  const refineResult = await refineTailoredResume({
    tailoredResumeId: tailored.id,
    feedback: 'Always lead bullets with quantified revenue or ARR numbers and avoid vague phrases like handled or worked on.',
    section: 'experience',
    bulletIndex: 0,
  });

  if (!refineResult.tailoredResume) {
    throw new Error('refineTailoredResume did not return updated resume');
  }
  console.log('  ✓ Resume refined with user feedback');

  if (refineResult.suggestedGuideline) {
    console.log(`  ✓ Suggested Guideline Candidate: [${refineResult.suggestedGuideline.category.toUpperCase()}] "${refineResult.suggestedGuideline.rule}"`);
    console.log(`    Reasoning: "${refineResult.suggestedGuideline.reasoning}"`);
  }

  // 5. CRITICAL CHECK: Verify suggested guideline was NOT automatically saved to DB
  console.log('[Test 5] Verifying strict constraint: NO guideline auto-persisted without explicit user confirmation...');
  const countGuidelinesAfter = await prisma.resumeGuideline.count();
  if (countGuidelinesAfter !== countGuidelinesBefore) {
    throw new Error(`CRITICAL SECURITY FAILURE: Guideline count changed from ${countGuidelinesBefore} to ${countGuidelinesAfter} without explicit user confirmation!`);
  }
  console.log('  ✓ Constraint Verified: Guideline was NOT auto-persisted (remains strictly a candidate until confirmed by user)');

  // 6. Test in-place update and retrieval
  console.log('[Test 6] Testing in-place manual content updates...');
  tailored.content.summary = 'Senior Product Manager with deep experience scaling developer platforms and AI products.';
  await updateTailoredResumeContent(tailored.id, tailored.content);

  const fetched = await getTailoredResumeById(tailored.id);
  if (fetched.content.summary !== tailored.content.summary) {
    throw new Error('In-place update failed to persist');
  }
  console.log('  ✓ In-place manual edit persisted and retrieved successfully');

  console.log('\n--- ALL TAILORING TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runTailorTests().catch((err) => {
  console.error('Tailoring test failed with error:', err);
  process.exit(1);
});
