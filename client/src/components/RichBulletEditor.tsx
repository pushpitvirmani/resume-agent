import React, { useRef } from 'react';
import { Bold, Sparkles, HelpCircle } from 'lucide-react';
import { renderFormattedBullet } from './templates/HarshitTemplate';

interface RichBulletEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
}

export const RichBulletEditor: React.FC<RichBulletEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter achievement bullet...',
  rows = 2,
  label,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleBoldSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      // No text selected, insert bold template
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = `${before}**bold text**${after}`;
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, start + 11);
      }, 10);
      return;
    }

    const selectedText = value.substring(start, end);
    // If already wrapped in **, unwrap it
    if (selectedText.startsWith('**') && selectedText.endsWith('**')) {
      const unwrapped = selectedText.slice(2, -2);
      const newValue = value.substring(0, start) + unwrapped + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + unwrapped.length);
      }, 10);
    } else {
      const wrapped = `**${selectedText}**`;
      const newValue = value.substring(0, start) + wrapped + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + wrapped.length);
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      handleBoldSelection();
    }
  };

  const handleInsertHook = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const hook = '**Impact Hook:** ';
    onChange(hook + value.replace(/^\*\*[^*]+\*\*:\s*/, ''));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(2, 13);
    }, 10);
  };

  return (
    <div className="space-y-1.5 w-full">
      {/* Mini Formatting Toolbar */}
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        {label && <span className="font-semibold text-slate-300">{label}</span>}
        <div className="flex items-center space-x-1.5 ml-auto">
          <button
            type="button"
            onClick={handleBoldSelection}
            title="Bold Selection (Ctrl+B)"
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-colors"
          >
            <Bold className="w-3 h-3" />
            <span>Bold</span>
          </button>
          <button
            type="button"
            onClick={handleInsertHook}
            title="Insert Bold Impact Lead-in Hook"
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            <span>+ Hook</span>
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans placeholder:text-slate-600"
      />

      {/* Live Formatted Mini Preview */}
      {value.includes('**') && (
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed">
          <span className="text-[9.5px] font-bold text-indigo-400 uppercase tracking-wider block mb-0.5">
            Render Preview:
          </span>
          <div className="line-clamp-2">{renderFormattedBullet(value)}</div>
        </div>
      )}
    </div>
  );
};
