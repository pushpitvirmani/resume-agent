import React from 'react';
import { RenderableResume, TemplateId, TemplateStyleOptions } from '../../types';
import { HarshitTemplate } from './HarshitTemplate';
import { MinimalistTemplate } from './MinimalistTemplate';
import { ExecutiveTemplate } from './ExecutiveTemplate';

export interface ResumeDocumentProps {
  templateId: TemplateId;
  resume: RenderableResume;
  options: TemplateStyleOptions;
}

export const ResumeDocument: React.FC<ResumeDocumentProps> = ({ templateId, resume, options }) => {
  switch (templateId) {
    case 'minimalist':
      return <MinimalistTemplate resume={resume} options={options} />;
    case 'executive':
      return <ExecutiveTemplate resume={resume} options={options} />;
    case 'harshit':
    default:
      return <HarshitTemplate resume={resume} options={options} />;
  }
};

export { HarshitTemplate, MinimalistTemplate, ExecutiveTemplate };
