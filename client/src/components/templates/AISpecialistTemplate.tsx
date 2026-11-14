import React from 'react';
import { RenderableResume, TemplateStyleOptions } from '../../types';
import { renderFormattedBullet } from './HarshitTemplate';

interface TemplateProps {
  resume: RenderableResume;
  options: TemplateStyleOptions;
}

export const AISpecialistTemplate: React.FC<TemplateProps> = ({ resume, options }) => {
  const fontSizeClasses = {
    compact: {
      name: 'text-2xl',
      contact: 'text-[9.5px]',
      sectionTitle: 'text-[11px] font-mono tracking-wider',
      roleTitle: 'text-[10.5px]',
      body: 'text-[10px] leading-[1.38]',
      bullet: 'text-[10px] leading-[1.38]',
    },
    standard: {
      name: 'text-3xl',
      contact: 'text-[10px]',
      sectionTitle: 'text-[12px] font-mono tracking-wider',
      roleTitle: 'text-[11.5px]',
      body: 'text-[10.5px] leading-[1.45]',
      bullet: 'text-[10.5px] leading-[1.45]',
    },
    relaxed: {
      name: 'text-4xl',
      contact: 'text-[11px]',
      sectionTitle: 'text-[13px] font-mono tracking-wider',
      roleTitle: 'text-[12.5px]',
      body: 'text-[11px] leading-[1.5]',
      bullet: 'text-[11px] leading-[1.5]',
    },
  }[options.fontSize];

  const spacingClasses = {
    compact: {
      padding: 'p-7 sm:p-9',
      sectionGap: 'space-y-3.5',
      experienceGap: 'space-y-2.5',
      bulletGap: 'space-y-1',
    },
    standard: {
      padding: 'p-9 sm:p-12',
      sectionGap: 'space-y-4.5',
      experienceGap: 'space-y-3',
      bulletGap: 'space-y-1.5',
    },
    roomy: {
      padding: 'p-10 sm:p-14',
      sectionGap: 'space-y-5.5',
      experienceGap: 'space-y-4',
      bulletGap: 'space-y-2',
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
      className={`bg-white text-slate-900 shadow-2xl mx-auto w-full max-w-[816px] min-h-[1056px] ${spacingClasses.padding} selection:bg-indigo-100 print:shadow-none print:p-0 print:max-w-none`}
    >
      {/* AI Systems Header */}
      <header className="pb-3 border-b-2" style={{ borderColor: options.accentColor || '#6366f1' }}>
        <div className="flex flex-col sm:flex-row items-baseline justify-between">
          <div>
            <h1
              style={{ color: options.accentColor || '#0f172a' }}
              className={`font-black tracking-tight text-slate-950 ${fontSizeClasses.name}`}
            >
              {resume.name}
            </h1>
            <p className="text-[11px] font-mono font-bold text-indigo-700 tracking-wide mt-0.5">
              Technical Product Manager • AI Systems & LLM Platforms
            </p>
          </div>

          <div className={`text-right text-slate-600 mt-2 sm:mt-0 ${fontSizeClasses.contact}`}>
            <div>{resume.location} • {resume.email}</div>
            <div>{resume.phone} • {resume.linkedinUrl?.replace(/^https?:\/\/(www\.)?/, '')}</div>
          </div>
        </div>
      </header>

      {/* Main Single-Column Flow */}
      <main className={`pt-3.5 ${spacingClasses.sectionGap}`}>
        {/* Technical Summary */}
        {resume.summary && (
          <section>
            <h2
              style={{ color: options.accentColor || '#4338ca' }}
              className={`font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-1 ${fontSizeClasses.sectionTitle}`}
            >
              <span>// 01. TECHNICAL SUMMARY</span>
            </h2>
            <p className={`text-slate-700 leading-relaxed ${fontSizeClasses.body}`}>
              {resume.summary}
            </p>
          </section>
        )}

        {/* AI & Systems Experience */}
        {resume.experience && resume.experience.length > 0 && (
          <section>
            <h2
              style={{ color: options.accentColor || '#4338ca' }}
              className={`font-bold uppercase tracking-wider mb-2.5 flex items-center space-x-1 ${fontSizeClasses.sectionTitle}`}
            >
              <span>// 02. PRODUCT & ENGINEERING EXPERIENCE</span>
            </h2>

            <div className={spacingClasses.experienceGap}>
              {resume.experience.map((exp, idx) => (
                <div key={exp.id || idx} className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <strong className={`font-bold text-slate-950 ${fontSizeClasses.roleTitle}`}>{exp.role}</strong>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className={`font-semibold text-slate-700 ${fontSizeClasses.roleTitle}`}>{exp.company}</span>
                    </div>

                    <div className="text-right text-slate-500 font-mono text-[10px]">
                      {exp.startDate && <span>{exp.startDate} – {exp.endDate || 'Present'}</span>}
                      {exp.location && <span className="ml-1.5 text-slate-400">[{exp.location}]</span>}
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

        {/* Technical Taxonomy & Stack */}
        {resume.skills && resume.skills.length > 0 && (
          <section>
            <h2
              style={{ color: options.accentColor || '#4338ca' }}
              className={`font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-1 ${fontSizeClasses.sectionTitle}`}
            >
              <span>// 03. TECHNICAL TAXONOMY & TOOLING</span>
            </h2>

            <div className="space-y-1">
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
              style={{ color: options.accentColor || '#4338ca' }}
              className={`font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-1 ${fontSizeClasses.sectionTitle}`}
            >
              <span>// 04. EDUCATION & FOUNDATIONS</span>
            </h2>

            <div className="space-y-1">
              {resume.education.map((edu, idx) => (
                <div key={edu.id || idx} className="flex items-baseline justify-between">
                  <div className={fontSizeClasses.body}>
                    <strong className="font-bold text-slate-900">{edu.degree} in {edu.fieldOfStudy}</strong>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-700">{edu.institution}</span>
                    {edu.honors && <span className="text-slate-500 italic ml-1.5">({edu.honors})</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
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
