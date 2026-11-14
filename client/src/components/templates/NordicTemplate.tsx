import React from 'react';
import { RenderableResume, TemplateStyleOptions } from '../../types';
import { renderFormattedBullet } from './HarshitTemplate';

interface TemplateProps {
  resume: RenderableResume;
  options: TemplateStyleOptions;
}

export const NordicTemplate: React.FC<TemplateProps> = ({ resume, options }) => {
  const fontSizeClasses = {
    compact: {
      name: 'text-2xl tracking-tight',
      contact: 'text-[9.5px]',
      sectionTitle: 'text-[11px] font-semibold tracking-wider',
      roleTitle: 'text-[10.5px]',
      body: 'text-[10px] leading-[1.4]',
      bullet: 'text-[10px] leading-[1.4]',
    },
    standard: {
      name: 'text-3xl tracking-tight',
      contact: 'text-[10px]',
      sectionTitle: 'text-[12px] font-semibold tracking-wider',
      roleTitle: 'text-[11.5px]',
      body: 'text-[10.5px] leading-[1.48]',
      bullet: 'text-[10.5px] leading-[1.48]',
    },
    relaxed: {
      name: 'text-4xl tracking-tight',
      contact: 'text-[11px]',
      sectionTitle: 'text-[13px] font-semibold tracking-wider',
      roleTitle: 'text-[12.5px]',
      body: 'text-[11px] leading-[1.55]',
      bullet: 'text-[11px] leading-[1.55]',
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
      className={`bg-white text-slate-800 shadow-2xl mx-auto w-full max-w-[816px] min-h-[1056px] ${spacingClasses.padding} selection:bg-teal-100 print:shadow-none print:p-0 print:max-w-none`}
    >
      {/* Nordic Clean Header */}
      <header className="pb-3 border-b" style={{ borderColor: options.accentColor || '#0d9488' }}>
        <h1
          style={{ color: options.accentColor || '#0f172a' }}
          className={`font-semibold text-slate-900 ${fontSizeClasses.name}`}
        >
          {resume.name}
        </h1>
        <p className="text-[11px] font-medium text-slate-500 mt-0.5">
          Senior Product Manager • AI Systems & Platform Strategy
        </p>

        <div className={`flex flex-wrap items-center gap-x-3 text-slate-600 mt-1.5 ${fontSizeClasses.contact}`}>
          {resume.location && <span>{resume.location}</span>}
          {resume.location && resume.email && <span>/</span>}
          {resume.email && <span className="text-slate-900 font-medium">{resume.email}</span>}
          {resume.phone && <span>/</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.linkedinUrl && <span>/</span>}
          {resume.linkedinUrl && <span>{resume.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>}
        </div>
      </header>

      {/* Main Single Column */}
      <main className={`pt-3.5 ${spacingClasses.sectionGap}`}>
        {/* Profile */}
        {resume.summary && (
          <section>
            <h2
              style={{ color: options.accentColor || '#0d9488' }}
              className={`font-bold uppercase tracking-widest text-[11px] mb-1.5 ${fontSizeClasses.sectionTitle}`}
            >
              About
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
              style={{ color: options.accentColor || '#0d9488' }}
              className={`font-bold uppercase tracking-widest text-[11px] mb-2.5 ${fontSizeClasses.sectionTitle}`}
            >
              Experience
            </h2>

            <div className={spacingClasses.experienceGap}>
              {resume.experience.map((exp, idx) => (
                <div key={exp.id || idx} className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <strong className={`font-semibold text-slate-900 ${fontSizeClasses.roleTitle}`}>{exp.role}</strong>
                      <span className="text-slate-400 mx-1.5">at</span>
                      <span className={`font-medium text-slate-700 ${fontSizeClasses.roleTitle}`}>{exp.company}</span>
                    </div>

                    <div className="text-right text-slate-500 text-[10px]">
                      {exp.startDate && <span>{exp.startDate} – {exp.endDate || 'Present'}</span>}
                      {exp.location && <span className="ml-1.5 text-slate-400">({exp.location})</span>}
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

        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <section>
            <h2
              style={{ color: options.accentColor || '#0d9488' }}
              className={`font-bold uppercase tracking-widest text-[11px] mb-1.5 ${fontSizeClasses.sectionTitle}`}
            >
              Competencies
            </h2>

            <div className="space-y-1">
              {resume.skills.map((cat, idx) => (
                <div key={idx} className={`${fontSizeClasses.body} text-slate-700`}>
                  <strong className="font-semibold text-slate-900 mr-1.5">{cat.category}:</strong>
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
              style={{ color: options.accentColor || '#0d9488' }}
              className={`font-bold uppercase tracking-widest text-[11px] mb-1.5 ${fontSizeClasses.sectionTitle}`}
            >
              Education
            </h2>

            <div className="space-y-1">
              {resume.education.map((edu, idx) => (
                <div key={edu.id || idx} className="flex items-baseline justify-between">
                  <div className={fontSizeClasses.body}>
                    <strong className="font-semibold text-slate-900">{edu.degree} in {edu.fieldOfStudy}</strong>
                    <span className="text-slate-400 mx-1.5">—</span>
                    <span className="text-slate-700">{edu.institution}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
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
