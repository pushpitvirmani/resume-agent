process.env.IN_TEST = 'true';
import app from '../src/index.js';
import prisma from '../src/db.js';

let server: any;
const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('--- Starting API Integration Tests ---');
  server = app.listen(PORT);

  try {
    // 1. Test Health Endpoint
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    if (health.status !== 'ok') throw new Error('Health check failed');
    console.log('✓ GET /api/health passed');

    // 2. Test Master Resume GET
    const resumeRes = await fetch(`${BASE_URL}/api/resume`);
    const resumeData = await resumeRes.json();
    if (!resumeData.profile || resumeData.profile.name !== 'Pushpit Virmani') {
      throw new Error(`Expected Pushpit Virmani, got: ${resumeData.profile?.name}`);
    }
    console.log('✓ GET /api/resume passed (Found:', resumeData.profile.name, ')');

    // 3. Test Master Resume PUT
    const updatedProfile = {
      ...resumeData.profile,
      summary: 'Updated Senior PM Summary for automated testing.'
    };
    const updateRes = await fetch(`${BASE_URL}/api/resume`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProfile)
    });
    const updateData = await updateRes.json();
    if (updateData.profile.summary !== 'Updated Senior PM Summary for automated testing.') {
      throw new Error('Resume PUT update failed');
    }
    console.log('✓ PUT /api/resume passed');

    // 3b. Test Resume Styling Persistence
    const stylingProfile = {
      ...updateData.profile,
      styling: {
        templateId: 'ivyleague',
        options: {
          fontFamily: 'Garamond',
          fontSize: 'compact',
          spacing: 'compact',
          accentColor: '#1c1917'
        }
      }
    };
    const stylingUpdateRes = await fetch(`${BASE_URL}/api/resume`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stylingProfile)
    });
    const stylingUpdateData = await stylingUpdateRes.json();
    if (stylingUpdateData.profile?.styling?.templateId !== 'ivyleague') {
      throw new Error(`Expected templateId ivyleague, got: ${stylingUpdateData.profile?.styling?.templateId}`);
    }
    // Verify GET persists styling
    const getStylingRes = await fetch(`${BASE_URL}/api/resume`);
    const getStylingData = await getStylingRes.json();
    if (getStylingData.profile?.styling?.options?.fontFamily !== 'Garamond') {
      throw new Error(`Expected fontFamily Garamond, got: ${getStylingData.profile?.styling?.options?.fontFamily}`);
    }
    console.log('✓ Resume Styling persistence verified (templateId: ivyleague, font: Garamond)');

    // 4. Test Master Resume PUT Validation (Invalid email)
    const invalidRes = await fetch(`${BASE_URL}/api/resume`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...resumeData.profile, email: 'not-an-email' })
    });
    if (invalidRes.status !== 400) throw new Error('Expected 400 for invalid email');
    console.log('✓ PUT /api/resume validation error handling passed (400)');

    // 5. Test Settings GET and PUT
    const settingsGetRes = await fetch(`${BASE_URL}/api/settings`);
    const settingsGetData = await settingsGetRes.json();
    if (!settingsGetData.settings || typeof settingsGetData.settings.maxScrapeJobs !== 'number') {
      throw new Error('Settings GET missing maxScrapeJobs');
    }
    const targetLimit = settingsGetData.settings.maxScrapeJobs === 50 ? 25 : 50;
    console.log('✓ GET /api/settings passed (current maxScrapeJobs:', settingsGetData.settings.maxScrapeJobs, ')');

    const settingsPutRes = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maxScrapeJobs: targetLimit,
        dateFilterPreset: 'past_24h'
      })
    });
    const settingsPutData = await settingsPutRes.json();
    if (settingsPutData.settings.maxScrapeJobs !== targetLimit || settingsPutData.settings.dateFilterPreset !== 'past_24h') {
      throw new Error('Settings PUT update failed');
    }
    console.log(`✓ PUT /api/settings passed (Updated to ${targetLimit} jobs, past_24h)`);

    // 6. Test Guidelines GET and POST
    const guidelinesRes = await fetch(`${BASE_URL}/api/guidelines`);
    const guidelinesData = await guidelinesRes.json();
    if (!Array.isArray(guidelinesData.guidelines) || guidelinesData.guidelines.length < 3) {
      throw new Error('Expected at least 3 baseline guidelines');
    }
    console.log('✓ GET /api/guidelines passed (Count:', guidelinesData.guidelines.length, ')');

    const newGuidelineRes = await fetch(`${BASE_URL}/api/guidelines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rule: 'Test rule: Always emphasize cross-functional leadership in staff PM roles',
        category: 'style'
      })
    });
    if (newGuidelineRes.status !== 201) throw new Error('POST guideline failed');
    const createdGuideline = await newGuidelineRes.json();
    console.log('✓ POST /api/guidelines passed');

    // 7. Test Jobs POST and GET
    const testUrl = `https://www.linkedin.com/jobs/view/test-${Date.now()}`;
    const jobPostRes = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Senior AI Product Manager',
        company: 'Anthropic',
        location: 'San Francisco, CA (Remote)',
        url: testUrl,
        description: 'Lead next generation AI model interfaces and agentic tooling.'
      })
    });
    if (jobPostRes.status !== 201) throw new Error('POST job failed');
    console.log('✓ POST /api/jobs passed');

    const jobsGetRes = await fetch(`${BASE_URL}/api/jobs`);
    const jobsGetData = await jobsGetRes.json();
    if (!jobsGetData.jobs.some((j: any) => j.url === testUrl)) {
      throw new Error('Created job not found in GET /api/jobs');
    }
    console.log('✓ GET /api/jobs passed (Found created test job)');

    // 8. Test AI Status Endpoint
    const aiRes = await fetch(`${BASE_URL}/api/ai/status`);
    const aiData = await aiRes.json();
    if (!aiData.providers || !aiData.providers.gemini) {
      throw new Error('AI status response missing providers structure');
    }
    console.log('✓ GET /api/ai/status passed (Gemini connected:', aiData.providers.gemini.connected, ')');

    // 9. Test Scraper Status and Trigger Endpoints
    const scraperStatusRes = await fetch(`${BASE_URL}/api/scraper/status`);
    const scraperStatusData = await scraperStatusRes.json();
    if (!scraperStatusData.ok || !scraperStatusData.status) {
      throw new Error('GET /api/scraper/status failed');
    }
    console.log('✓ GET /api/scraper/status passed (Status:', scraperStatusData.status.progress, ')');

    const triggerRes = await fetch(`${BASE_URL}/api/scraper/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: 'Product Manager', maxJobs: 1 }),
    });
    const triggerData = await triggerRes.json();
    if (!triggerData.ok && triggerData.message !== 'Scraping is already running.') {
      throw new Error('POST /api/scraper/trigger failed');
    }
    console.log('✓ POST /api/scraper/trigger passed (Message:', triggerData.message, ')');

    // Cleanup created test guideline
    await prisma.resumeGuideline.delete({ where: { id: createdGuideline.guideline.id } });

    console.log('\n--- ALL API INTEGRATION TESTS PASSED CLEANLY! ---');
    process.exit(0);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((e) => {
  console.error('Test Failed:', e);
  if (server) server.close();
  process.exit(1);
});
