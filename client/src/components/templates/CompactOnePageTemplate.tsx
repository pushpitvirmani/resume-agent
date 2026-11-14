import React from 'react';
import { RenderableResume, TemplateStyleOptions } from '../../types';
import { renderFormattedBullet } from './HarshitTemplate';

interface TemplateProps {
  resume: RenderableResume;
  options: TemplateStyleOptions;
}

export const CompactOnePageTemplate: React.FC<TemplateProps> = ({ resume, options }) => {
  const fontSizeClasses = {
    compact: {
      name: 'text-xl',
      contact: 'text-[9px]',
      sectionTitle: 'text-[10px] tracking-wider font-bold',
      roleTitle: 'text-[10px]',
      body: 'text-[9.5px] leading-[1.32]',
      bullet: 'text-[9.5px] leading-[1.32]',
    },
    standard: {
      name: 'text-2xl',
      contact: 'text-[9.5px]',
      sectionTitle: 'text-[10.5px] tracking-wider font-bold',
      roleTitle: 'text-[10.5px]',
      body: 'text-[10px] leading-[1.36]',
      bullet: 'text-[10px] leading-[1.36]',
    },
    relaxed: {
      name: 'text-[26px]',
      contact: 'text-[10px]',
      sectionTitle: 'text-[11.5px] tracking-wider font-bold',
      roleTitle: 'text-[11.5px]',
      body: 'text-[10.5px] leading-[1.42]',
      bullet: 'text-[10.5px] leading-[1.42]',
    },
  }[options.fontSize];

  const spacingClasses = {
    compact: {
      padding: 'p-5 sm:p-7',
      sectionGap: 'space-y-2.5',
      experienceGap: 'space-y-1.5',
      bulletGap: 'space-y-0.5',
    },
    standard: {
      padding: 'p-6 sm:p-8',
      sectionGap: 'space-y-3',
      experienceGap: 'space-y-2',
      bulletGap: 'space-y-1',
    },
    roomy: {
      padding: 'p-7 sm:p-9',
      sectionGap: 'space-y-3.5',
      experienceGap: 'space-y-2.5',
      bulletGap: 'space-y-1.5',
    },
  }[options.spacing];

  const fontStyle = {
    fontFamily: options.fontFamily === 'Inter'
      ? 'Inter, system-ui, sans-serif'
      : options.fontFamily === 'Calibri'
      ? 'Calibri, sans-serif'
      : 'Arial, sans-serif',
  };

  return (
    <div
      id="resume-document-root"
      style={fontStyle}
      className={`bg-white text-slate-900 shadow-2xl mx-auto w-full max-w-[816px] min-h-[1056px] ${spacingClasses.padding} selection:bg-orange-100 print:shadow-none print:p-0 print:max-w-none`}
    >
      {/* YC Compact Header */}
      <header className="text-center pb-2 border-b-2" style={{ borderColor: options.accentColor || '#ea580c' }}>
        <h1
          style={{ color: options.accentColor || '#0f172a' }}
          className={`font-black text-slate-950 uppercase tracking-tight ${fontSizeClasses.name}`}
        >
          {resume.name}
        </h1>

        <div className={`flex flex-wrap items-center justify-center gap-x-2 text-slate-600 mt-0.5 ${fontSizeClasses.contact}`}>
          {resume.location && <span>{resume.location}</span>}
          {resume.location && resume.email && <span>•</span>}
          {resume.email && <span className="font-semibold text-slate-900">{resume.email}</span>}
          {resume.phone && <span>•</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.linkedinUrl && <span>•</span>}
          {resume.linkedinUrl && <span>{resume.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>}
        </div>
      </header>

      {/* Main Content */}
      <main className={`pt-2 ${spacingClasses.sectionGap}`}>
        {/* Summary */}
        {resume.summary && (
          <section>
            <h2
              style={{ color: options.accentColor || '#ea580c' }}
              className={`uppercase border-b pb-0.5 mb-1 ${fontSizeClasses.sectionTitle}`}
            >
              Summary
            </h2>
            <p className={`text-slate-800 text-justify ${fontSizeClasses.body}`}>
              {resume.summary}
            </p>
          </section>
        )}

        {/* Experience */}
        {resume.experience && resume.experience.length > 0 && (
          <section>
            <h2
              style={{ color: options.accentColor || '#ea580c' }}
              className={`uppercase border-b pb-0.5 mb-1.5 ${fontSizeClasses.sectionTitle}`}
            >
              Experience
            </h2>

            <div className={spacingClasses.experienceGap}>
              {resume.experience.map((exp, idx) => (
                <div key={exp.id || idx} className="space-y-0.5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <strong className={`font-bold text-slate-950 ${fontSizeClasses.roleTitle}`}>{exp.role}</strong>
                      <span className="text-slate-400 mx-1.5">—</span>
                      <span className={`font-semibold text-slate-800 ${fontSizeClasses.roleTitle}`}>{exp.company}</span>
                    </div>

                    <div className="text-right text-slate-500 text-[9.5px] font-semibold">
                      {exp.startDate && <span>{exp.startDate} – {exp.endDate || 'Present'}</span>}
                      {exp.location && <span className="ml-1 text-slate-400">({exp.location})</span>}
                    </div>
                  </div>

                  <ul className={`list-disc list-outside ml-3.5 text-slate-800 ${spacingClasses.bulletGap} ${fontSizeClasses.bullet}`}>
                    {exp.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="pl-0.5">
                        {renderFormattedBullet(bullet)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <section>
            <h2
              style={{ color: options.accentColor || '#ea580c' }}
              className={`uppercase border-b pb-0.5 mb-1 ${fontSizeClasses.sectionTitle}`}
            >
              Skills & Technologies
            </h2>

            <div className="space-y-0.5">
              {resume.skills.map((cat, idx) => (
                <div key={idx} className={`${fontSizeClasses.body} text-slate-800`}>
                  <strong className="font-bold text-slate-950 mr-1">{cat.category}:</strong>
                  <span>{cat.skills.join(' • ')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <section>
            <h2
              style={{ color: options.accentColor || '#ea580c' }}
              className={`uppercase border-b pb-0.5 mb-1 ${fontSizeClasses.sectionTitle}`}
            >
              Education
            </h2>

            <div className="space-y-0.5">
              {resume.education.map((edu, idx) => (
                <div key={edu.id || idx} className="flex items-baseline justify-between">
                  <div className={fontSizeClasses.body}>
                    <strong className="font-bold text-slate-900">{edu.degree} in {edu.fieldOfStudy}</strong>
                    <span className="text-slate-400 mx-1.5">—</span>
                    <span className="text-slate-700">{edu.institution}</span>
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-semibold">
                    {edu.graduationYear}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
