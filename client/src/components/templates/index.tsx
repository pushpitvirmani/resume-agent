import React from 'react';
import { RenderableResume, TemplateId, TemplateStyleOptions, TemplateMetadata } from '../../types';
import { HarshitTemplate } from './HarshitTemplate';
import { MinimalistTemplate } from './MinimalistTemplate';
import { ExecutiveTemplate } from './ExecutiveTemplate';
import { IvyLeagueTemplate } from './IvyLeagueTemplate';
import { ConsultingTemplate } from './ConsultingTemplate';
import { AISpecialistTemplate } from './AISpecialistTemplate';
import { GrowthTemplate } from './GrowthTemplate';
import { EnterpriseTemplate } from './EnterpriseTemplate';
import { CompactOnePageTemplate } from './CompactOnePageTemplate';
import { NordicTemplate } from './NordicTemplate';

export const TEMPLATES_CATALOG: TemplateMetadata[] = [
  {
    id: 'harshit',
    name: 'Harshit Technical PM',
    company: 'Google / Meta',
    tagline: 'Tracked uppercase headers, bold impact hooks, solid horizontal line dividers.',
    accent: '#0f172a',
    bestFor: 'Top-tier tech, technical product managers, AI engineering teams'
  },
  {
    id: 'minimalist',
    name: 'Silicon Valley Minimalist',
    company: 'Stripe / OpenAI',
    tagline: 'Crisp left-aligned header with accent border, streamlined modern typography.',
    accent: '#4f46e5',
    bestFor: 'Fast-moving AI startups, developer platforms, modern tech companies'
  },
  {
    id: 'executive',
    name: 'Executive Product Leader',
    company: 'Apple / Amazon',
    tagline: 'Emphasized executive profile box, strategic competency pillars, leadership focus.',
    accent: '#1e3a8a',
    bestFor: 'Senior / Principal / Director PMs, cross-functional leadership'
  },
  {
    id: 'ivyleague',
    name: 'Ivy League & Wall Street',
    company: 'Harvard / Goldman Sachs',
    tagline: 'Timeless Garamond serif typography, centered academic style, clean dividers.',
    accent: '#1c1917',
    bestFor: 'FinTech, quantitative strategy, corporate development, tier-1 finance'
  },
  {
    id: 'consulting',
    name: 'Modern Tech Consulting',
    company: 'McKinsey / BCG',
    tagline: 'Structured tabular deliverables, quantitative metrics, engagement scope.',
    accent: '#0369a1',
    bestFor: 'Digital transformation, client strategy, management consulting'
  },
  {
    id: 'aispecialist',
    name: 'AI & ML Systems Specialist',
    company: 'DeepMind / Anthropic',
    tagline: 'Code-inspired section headers, AI systems taxonomy, technical stack.',
    accent: '#6366f1',
    bestFor: 'LLM product management, AI research labs, agentic systems platforms'
  },
  {
    id: 'growth',
    name: 'Growth & Data Product Manager',
    company: 'Netflix / Uber',
    tagline: 'Metric-forward presentation, highlighted experiment KPIs and funnel metrics.',
    accent: '#047857',
    bestFor: 'Consumer apps, growth hacking, monetization & retention product managers'
  },
  {
    id: 'enterprise',
    name: 'Enterprise SaaS Architect',
    company: 'Salesforce / Microsoft',
    tagline: 'B2B platform extensibility, enterprise ARR, security and SLA reliability.',
    accent: '#1e40af',
    bestFor: 'Cloud infrastructure, B2B SaaS, developer APIs and enterprise software'
  },
  {
    id: 'compact',
    name: 'Compact 1-Page Maximum',
    company: 'YC Startups',
    tagline: 'Ultra-dense vertical spacing and micro-margins guaranteed to fit 1 page.',
    accent: '#ea580c',
    bestFor: 'High-density careers, fitting comprehensive achievements onto 1 page'
  },
  {
    id: 'nordic',
    name: 'Nordic Clean Modern',
    company: 'Spotify / Klarna',
    tagline: 'Scandinavian airy typography, subtle teal/slate accents, modern ATS clarity.',
    accent: '#0d9488',
    bestFor: 'Design-forward tech, international applications, modern product teams'
  }
];

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
    case 'ivyleague':
      return <IvyLeagueTemplate resume={resume} options={options} />;
    case 'consulting':
      return <ConsultingTemplate resume={resume} options={options} />;
    case 'aispecialist':
      return <AISpecialistTemplate resume={resume} options={options} />;
    case 'growth':
      return <GrowthTemplate resume={resume} options={options} />;
    case 'enterprise':
      return <EnterpriseTemplate resume={resume} options={options} />;
    case 'compact':
      return <CompactOnePageTemplate resume={resume} options={options} />;
    case 'nordic':
      return <NordicTemplate resume={resume} options={options} />;
    case 'harshit':
    default:
      return <HarshitTemplate resume={resume} options={options} />;
  }
};

export {
  HarshitTemplate,
  MinimalistTemplate,
  ExecutiveTemplate,
  IvyLeagueTemplate,
  ConsultingTemplate,
  AISpecialistTemplate,
  GrowthTemplate,
  EnterpriseTemplate,
  CompactOnePageTemplate,
  NordicTemplate
};
