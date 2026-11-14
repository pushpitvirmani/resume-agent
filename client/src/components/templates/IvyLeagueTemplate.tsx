import React from 'react';
import { RenderableResume, TemplateStyleOptions } from '../../types';
import { renderFormattedBullet } from './HarshitTemplate';

interface TemplateProps {
  resume: RenderableResume;
  options: TemplateStyleOptions;
}

export const IvyLeagueTemplate: React.FC<TemplateProps> = ({ resume, options }) => {
  const fontSizeClasses = {
    compact: {
      name: 'text-2xl',
      contact: 'text-[9.5px]',
      sectionTitle: 'text-[11px] tracking-wider',
      roleTitle: 'text-[10.5px]',
      body: 'text-[10px] leading-[1.38]',
      bullet: 'text-[10px] leading-[1.38]',
    },
    standard: {
      name: 'text-3xl',
      contact: 'text-[10px]',
      sectionTitle: 'text-[12px] tracking-wider',
      roleTitle: 'text-[11.5px]',
      body: 'text-[10.5px] leading-[1.45]',
      bullet: 'text-[10.5px] leading-[1.45]',
    },
    relaxed: {
      name: 'text-4xl',
      contact: 'text-[11px]',
      sectionTitle: 'text-[13px] tracking-wider',
      roleTitle: 'text-[12.5px]',
      body: 'text-[11px] leading-[1.5]',
      bullet: 'text-[11px] leading-[1.5]',
    },
  }[options.fontSize];

  const spacingClasses = {
    compact: {
      padding: 'p-8 sm:p-10',
      sectionGap: 'space-y-3.5',
      experienceGap: 'space-y-2.5',
      bulletGap: 'space-y-1',
    },
    standard: {
      padding: 'p-10 sm:p-12',
      sectionGap: 'space-y-4.5',
      experienceGap: 'space-y-3',
      bulletGap: 'space-y-1.5',
    },
    roomy: {
      padding: 'p-11 sm:p-14',
      sectionGap: 'space-y-5.5',
      experienceGap: 'space-y-4',
      bulletGap: 'space-y-2',
    },
  }[options.spacing];

  const fontStyle = {
    fontFamily: options.fontFamily === 'Inter'
      ? 'Garamond, "EB Garamond", Georgia, serif'
      : options.fontFamily === 'Georgia'
      ? 'Georgia, serif'
      : 'Garamond, "Times New Roman", serif',
  };

  return (
    <div
      id="resume-document-root"
      style={fontStyle}
      className={`bg-white text-slate-900 shadow-2xl mx-auto w-full max-w-[816px] min-h-[1056px] ${spacingClasses.padding} selection:bg-amber-100 print:shadow-none print:p-0 print:max-w-none`}
    >
      {/* Header: Centered Academic Serif */}
      <header className="text-center pb-2.5 border-b border-slate-400">
        <h1
          style={{ color: options.accentColor || '#0f172a' }}
          className={`font-serif font-bold text-slate-950 uppercase tracking-widest ${fontSizeClasses.name}`}
        >
          {resume.name}
        </h1>

        <div className={`flex flex-wrap items-center justify-center gap-x-2 text-slate-700 mt-1 font-serif ${fontSizeClasses.contact}`}>
          {resume.location && <span>{resume.location}</span>}
          {resume.location && resume.email && <span>•</span>}
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>•</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.linkedinUrl && <span>•</span>}
          {resume.linkedinUrl && <span>{resume.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>}
        </div>
      </header>

      {/* Main Flow */}
      <main className={`pt-3 ${spacingClasses.sectionGap}`}>
        {/* Education (Often top for Ivy / Wall Street) */}
        {resume.education && resume.education.length > 0 && (
          <section>
            <h2
              style={{ color: options.accentColor || '#0f172a', borderColor: options.accentColor || '#334155' }}
              className={`font-serif font-bold uppercase pb-0.5 border-b mb-2 ${fontSizeClasses.sectionTitle}`}
            >
              EDUCATION
            </h2>

            <div className="space-y-1.5 font-serif">
              {resume.education.map((edu, idx) => (
                <div key={edu.id || idx} className="flex items-baseline justify-between">
                  <div className={fontSizeClasses.body}>
                    <strong className="font-bold text-slate-950">{edu.institution}</strong>
                    <span className="text-slate-600 mx-1.5">—</span>
                    <span className="italic text-slate-800">{edu.degree} in {edu.fieldOfStudy}</span>
                    {edu.honors && <span className="text-slate-600 ml-1.5">({edu.honors})</span>}
                  </div>
                  <div className="text-[10px] text-slate-700 font-medium">
                    {edu.graduationYear}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Professional Experience */}
        {resume.experience && resume.experience.length > 0 && (
          <section>
            <h2
              style={{ color: options.accentColor || '#0f172a', borderColor: options.accentColor || '#334155' }}
              className={`font-serif font-bold uppercase pb-0.5 border-b mb-2.5 ${fontSizeClasses.sectionTitle}`}
            >
              PROFESSIONAL EXPERIENCE
            </h2>

            <div className={spacingClasses.experienceGap}>
              {resume.experience.map((exp, idx) => (
                <div key={exp.id || idx} className="space-y-1 font-serif">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <strong className={`font-bold text-slate-950 ${fontSizeClasses.roleTitle}`}>{exp.company}</strong>
                      <span className="text-slate-600 mx-1.5">—</span>
                      <span className={`italic text-slate-800 ${fontSizeClasses.roleTitle}`}>{exp.role}</span>
                    </div>

                    <div className="text-right text-slate-700 text-[10px] font-medium">
                      {exp.startDate && <span>{exp.startDate} – {exp.endDate || 'Present'}</span>}
                      {exp.location && <span className="ml-1.5 text-slate-600">({exp.location})</span>}
                    </div>
                  </div>

                  <ul className={`list-disc list-outside ml-4 text-slate-800 ${spacingClasses.bulletGap} ${fontSizeClasses.bullet}`}>
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

        {/* Summary / Profile */}
        {resume.summary && (
          <section>
            <h2
              style={{ color: options.accentColor || '#0f172a', borderColor: options.accentColor || '#334155' }}
              className={`font-serif font-bold uppercase pb-0.5 border-b mb-2 ${fontSizeClasses.sectionTitle}`}
            >
              EXECUTIVE PROFILE
            </h2>
            <p className={`font-serif text-slate-800 text-justify ${fontSizeClasses.body}`}>
              {resume.summary}
            </p>
          </section>
        )}

        {/* Skills & Additional Info */}
        {resume.skills && resume.skills.length > 0 && (
          <section>
            <h2
              style={{ color: options.accentColor || '#0f172a', borderColor: options.accentColor || '#334155' }}
              className={`font-serif font-bold uppercase pb-0.5 border-b mb-2 ${fontSizeClasses.sectionTitle}`}
            >
              SKILLS & EXPERTISE
            </h2>

            <div className="space-y-1 font-serif">
              {resume.skills.map((cat, idx) => (
                <div key={idx} className={`${fontSizeClasses.body} text-slate-800`}>
                  <strong className="font-bold text-slate-950 mr-1.5">{cat.category}:</strong>
                  <span>{cat.skills.join(' • ')}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
