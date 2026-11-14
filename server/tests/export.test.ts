import { generateResumeDocx } from '../src/services/docxExport.js';
import express from 'express';
import exportRouter from '../src/routes/export.js';
import http from 'http';

async function runExportTests() {
  console.log('--- Starting Export Engine Tests ---');

  // Test 1: Direct DOCX Buffer Generation
  const sampleData = {
    name: 'Pushpit Virmani',
    email: 'pushpit@example.com',
    phone: '+1 555-0199',
    location: 'San Francisco, CA',
    linkedinUrl: 'linkedin.com/in/pushpit',
    summary: 'Senior Product Manager with expertise in **AI platforms** and **large-scale SaaS**.',
    experience: [
      {
        company: 'Apex AI Tech',
        role: 'Lead Product Manager',
        location: 'San Francisco, CA',
        startDate: 'Jan 2022',
        endDate: 'Present',
        bullets: [
          '**Architected AI Agent Platform:** Grew monthly active users by **140%** in 6 months.',
          '**Accelerated API Latency:** Reduced response time by **35%** across core inference pipelines.'
        ]
      }
    ],
    skills: [
      { category: 'AI & Machine Learning', skills: ['LLMs', 'Prompt Engineering', 'LangChain', 'Python'] },
      { category: 'Product Leadership', skills: ['Roadmapping', 'A/B Testing', 'OKRs', 'GTM Strategy'] }
    ],
    education: [
      {
        institution: 'University of Engineering',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        graduationYear: '2020',
        honors: 'Summa Cum Laude'
      }
    ]
  };

  const docxBuffer = await generateResumeDocx(sampleData);
  if (!docxBuffer || docxBuffer.length < 2000) {
    throw new Error(`DOCX buffer too small or empty (${docxBuffer?.length} bytes)`);
  }
  console.log(`✓ Direct generateResumeDocx passed (${docxBuffer.length} bytes generated)`);

  // Test 2: HTTP Route Testing
  const app = express();
  app.use(express.json());
  app.use('/api/export', exportRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/api/export`;

  try {
    // Test POST /api/export/docx
    const docxRes = await fetch(`${baseUrl}/docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeData: sampleData })
    });

    if (!docxRes.ok) {
      throw new Error(`POST /docx failed with status ${docxRes.status}`);
    }

    const contentType = docxRes.headers.get('content-type');
    const contentDisposition = docxRes.headers.get('content-disposition');
    const blob = await docxRes.arrayBuffer();

    if (!contentType?.includes('officedocument.wordprocessingml')) {
      throw new Error(`Unexpected Content-Type: ${contentType}`);
    }
    if (!contentDisposition?.includes('attachment')) {
      throw new Error(`Unexpected Content-Disposition: ${contentDisposition}`);
    }
    if (blob.byteLength < 2000) {
      throw new Error(`Received DOCX blob too small: ${blob.byteLength} bytes`);
    }

    console.log(`✓ POST /api/export/docx passed (Status 200, ${blob.byteLength} bytes, valid MIME headers)`);

    // Test POST /api/export/batch with mock/empty validation
    const emptyBatchRes = await fetch(`${baseUrl}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobIds: [] })
    });

    if (emptyBatchRes.status !== 400) {
      throw new Error(`Expected 400 for empty jobIds batch, got ${emptyBatchRes.status}`);
    }
    console.log('✓ POST /api/export/batch validation error handling passed (400 on empty)');

  } finally {
    server.close();
  }

  console.log('--- ALL EXPORT ENGINE TESTS PASSED! ---');
}

runExportTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Export test failed:', err);
    process.exit(1);
  });
