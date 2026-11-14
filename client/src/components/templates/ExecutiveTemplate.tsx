import React from 'react';
import { RenderableResume, TemplateStyleOptions } from '../../types';
import { renderFormattedBullet } from './HarshitTemplate';

interface TemplateProps {
  resume: RenderableResume;
  options: TemplateStyleOptions;
}

export const ExecutiveTemplate: React.FC<TemplateProps> = ({ resume, options }) => {
  const fontSizeClasses = {
    compact: {
      name: 'text-2xl',
      contact: 'text-[9.5px]',
      sectionTitle: 'text-[11px] tracking-wider',
      roleTitle: 'text-[11px]',
      body: 'text-[10px] leading-[1.4]',
      bullet: 'text-[10px] leading-[1.4]',
    },
    standard: {
      name: 'text-3xl',
      contact: 'text-[10px]',
      sectionTitle: 'text-[12px] tracking-wider',
      roleTitle: 'text-[12px]',
      body: 'text-[10.5px] leading-[1.48]',
      bullet: 'text-[10.5px] leading-[1.48]',
    },
    relaxed: {
      name: 'text-4xl',
      contact: 'text-[11px]',
      sectionTitle: 'text-[13px] tracking-wider',
      roleTitle: 'text-[13px]',
      body: 'text-[11px] leading-[1.55]',
      bullet: 'text-[11px] leading-[1.55]',
    },
  }[options.fontSize];

  const spacingClasses = {
    compact: {
      padding: 'p-7 sm:p-9',
      sectionGap: 'space-y-4',
      experienceGap: 'space-y-3',
      bulletGap: 'space-y-1',
    },
    standard: {
      padding: 'p-9 sm:p-12',
      sectionGap: 'space-y-5',
      experienceGap: 'space-y-3.5',
      bulletGap: 'space-y-1.5',
    },
    roomy: {
      padding: 'p-10 sm:p-14',
      sectionGap: 'space-y-6',
      experienceGap: 'space-y-4.5',
      bulletGap: 'space-y-2',
    },
  }[options.spacing];

  const fontStyle = {
    fontFamily: options.fontFamily === 'Inter'
      ? 'Inter, system-ui, sans-serif'
      : options.fontFamily === 'Garamond'
      ? 'Garamond, "EB Garamond", Georgia, serif'
      : options.fontFamily === 'Georgia'
      ? 'Georgia, serif'
      : options.fontFamily === 'Calibri'
      ? 'Calibri, Candara, Segoe, sans-serif'
      : 'Arial, Helvetica, sans-serif',
  };

  return (
    <div
      id="resume-document-root"
      style={fontStyle}
      className={`bg-white text-slate-800 shadow-2xl mx-auto w-full max-w-[816px] min-h-[1056px] ${spacingClasses.padding} selection:bg-indigo-100 font-sans print:shadow-none print:p-0 print:max-w-none`}
    >
      {/* Header: Executive Center with Subtitle */}
      <header className="text-center pb-4 border-b-2" style={{ borderColor: options.accentColor || '#1e3a8a' }}>
        <h1
          style={{ color: options.accentColor || '#0f172a' }}
          className={`font-black text-slate-900 tracking-tight ${fontSizeClasses.name}`}
        >
          {resume.name}
        </h1>
        <p className="text-[11.5px] font-bold text-slate-600 uppercase tracking-widest mt-1">
          Technical Product Management Executive
        </p>

        <div className={`flex flex-wrap items-center justify-center gap-x-2.5 text-slate-600 mt-2 ${fontSizeClasses.contact}`}>
          {resume.location && <span>{resume.location}</span>}
          {resume.location && resume.email && <span>•</span>}
          {resume.email && <span className="font-semibold text-slate-900">{resume.email}</span>}
          {resume.phone && <span>•</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.linkedinUrl && <span>•</span>}
          {resume.linkedinUrl && (
            <span className="text-slate-800 font-medium">
              {resume.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}
            </span>
          )}
        </div>
      </header>

      {/* Main Flow */}
      <main className={`pt-4 ${spacingClasses.sectionGap}`}>
        {/* Executive Profile */}
        {resume.summary && (
          <section className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <h2
              style={{ color: options.accentColor || '#0f172a' }}
              className={`font-bold uppercase mb-1.5 ${fontSizeClasses.sectionTitle}`}
            >
              Executive Summary & Scope
            </h2>
            <p className={`text-slate-700 leading-relaxed ${fontSizeClasses.body}`}>
              {resume.summary}
            </p>
          </section>
        )}

        {/* Experience */}
        {resume.experience && resume.experience.length > 0 && (
          <section>
            <h2
              style={{ color: options.accentColor || '#0f172a' }}
              className={`font-bold uppercase pb-1 border-b border-slate-300 mb-3 ${fontSizeClasses.sectionTitle}`}
            >
              Professional Leadership & Experience
            </h2>

            <div className={spacingClasses.experienceGap}>
              {resume.experience.map((exp, idx) => (
                <div key={exp.id || idx} className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className={`font-bold text-slate-900 ${fontSizeClasses.roleTitle}`}>
                        {exp.role}
                      </span>
                      <span className="text-slate-500 mx-2">|</span>
                      <span className={`font-bold text-slate-700 ${fontSizeClasses.roleTitle}`}>
                        {exp.company}
                      </span>
                    </div>

                    <div className="text-right text-slate-500 text-[10.5px] font-semibold">
                      {exp.startDate && <span>{exp.startDate} – {exp.endDate || 'Present'}</span>}
                      {exp.location && <span className="ml-2 font-normal text-slate-400">({exp.location})</span>}
                    </div>
                  </div>

                  <ul className={`list-disc list-outside ml-4 text-slate-700 ${spacingClasses.bulletGap} ${fontSizeClasses.bullet}`}>
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

        {/* Strategic Competencies */}
        {resume.skills && resume.skills.length > 0 && (
          <section>
            <h2
              style={{ color: options.accentColor || '#0f172a' }}
              className={`font-bold uppercase pb-1 border-b border-slate-300 mb-2 ${fontSizeClasses.sectionTitle}`}
            >
              Strategic Competencies & Tooling
            </h2>

            <div className="space-y-1.5">
              {resume.skills.map((cat, idx) => (
                <div key={idx} className={`${fontSizeClasses.body} text-slate-700`}>
                  <strong className="font-bold text-slate-900 mr-1.5">{cat.category}:</strong>
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
              style={{ color: options.accentColor || '#0f172a' }}
              className={`font-bold uppercase pb-1 border-b border-slate-300 mb-2 ${fontSizeClasses.sectionTitle}`}
            >
              Academic Background
            </h2>

            <div className="space-y-1">
              {resume.education.map((edu, idx) => (
                <div key={edu.id || idx} className="flex items-baseline justify-between">
                  <div className={fontSizeClasses.body}>
                    <strong className="font-bold text-slate-900">{edu.degree} in {edu.fieldOfStudy}</strong>
                    <span className="text-slate-400 mx-2">•</span>
                    <span className="text-slate-700">{edu.institution}</span>
                    {edu.honors && <span className="text-slate-500 italic ml-1.5">({edu.honors})</span>}
                  </div>
                  <div className="text-[10.5px] text-slate-500 font-medium">
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
