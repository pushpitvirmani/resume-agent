import React from 'react';
import { Plus, Trash2, GripVertical, Award } from 'lucide-react';
import { ExperienceItem } from '../types';
import { RichBulletEditor } from './RichBulletEditor';

interface ExperienceEditorProps {
  experience: ExperienceItem[];
  onChange: (items: ExperienceItem[]) => void;
}

export const ExperienceEditor: React.FC<ExperienceEditorProps> = ({ experience, onChange }) => {
  const addExperience = () => {
    const newItem: ExperienceItem = {
      id: Math.random().toString(36).substring(2, 9),
      company: 'New Company',
      role: 'Product Manager',
      location: 'Remote',
      startDate: 'Jan 2024',
      endDate: 'Present',
      isCurrent: true,
      bullets: ['Led product roadmap and strategic initiative resulting in quantifiable growth']
    };
    onChange([newItem, ...experience]);
  };

  const removeExperience = (index: number) => {
    const updated = [...experience];
    updated.splice(index, 1);
    onChange(updated);
  };

  const updateItem = (index: number, patch: Partial<ExperienceItem>) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };

  const addBullet = (expIndex: number) => {
    const updated = [...experience];
    updated[expIndex].bullets.push('Initiated high impact feature that improved conversion by 15%');
    onChange(updated);
  };

  const updateBullet = (expIndex: number, bulletIndex: number, text: string) => {
    const updated = [...experience];
    updated[expIndex].bullets[bulletIndex] = text;
    onChange(updated);
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...experience];
    updated[expIndex].bullets.splice(bulletIndex, 1);
    onChange(updated);
  };

  const hasMetric = (text: string) => {
    return /[$%€£]|(?:\d+(?:\.\d+)?(?:k|m|cr|x|\+))/i.test(text);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Work Experience</h3>
        <button
          type="button"
          onClick={addExperience}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Experience</span>
        </button>
      </div>

      <div className="space-y-4">
        {experience.map((exp, idx) => (
          <div
            key={exp.id || idx}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Company Name</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateItem(idx, { company: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Role Title</label>
                  <input
                    type="text"
                    value={exp.role}
                    onChange={(e) => updateItem(idx, { role: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeExperience(idx)}
                className="ml-3 p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Remove experience card"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Location</label>
                <input
                  type="text"
                  value={exp.location}
                  onChange={(e) => updateItem(idx, { location: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Start Date</label>
                <input
                  type="text"
                  value={exp.startDate}
                  onChange={(e) => updateItem(idx, { startDate: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">End Date</label>
                <input
                  type="text"
                  value={exp.endDate}
                  onChange={(e) => updateItem(idx, { endDate: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Bullets Sub-editor */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">
                  Accomplishment Bullets ({exp.bullets.length})
                </span>
                <button
                  type="button"
                  onClick={() => addBullet(idx)}
                  className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Bullet</span>
                </button>
              </div>

              <div className="space-y-3">
                {exp.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start space-x-2">
                    <div className="flex-1">
                      <RichBulletEditor
                        value={bullet}
                        onChange={(text) => updateBullet(idx, bIdx, text)}
                        placeholder="Highlight key metrics with bold: **40% growth** across core platform..."
                        rows={2}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBullet(idx, bIdx)}
                      className="p-1.5 mt-2 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove bullet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
