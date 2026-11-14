import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { ResumeProfile } from '../types';

interface ResumeUploadDropzoneProps {
  onUploadComplete: (profile: ResumeProfile) => void;
}

export const ResumeUploadDropzone: React.FC<ResumeUploadDropzoneProps> = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx') && !name.endsWith('.txt')) {
      setStatusMessage({ type: 'error', text: 'Please upload a PDF (.pdf) or Word document (.docx)' });
      return;
    }

    try {
      setIsUploading(true);
      setStatusMessage(null);
      const res = await api.uploadResume(file);
      setStatusMessage({
        type: 'success',
        text: `Successfully parsed and imported "${file.name}"! Form fields updated.`
      });
      onUploadComplete(res.profile);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to parse resume document.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-950/20 shadow-lg'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UploadCloud className="w-5 h-5" />
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-slate-200">
              {isUploading ? 'Parsing document with ATS extraction...' : 'Import Resume (PDF or DOCX)'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag & drop your existing resume to automatically parse and populate all fields
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mt-2.5 p-3 rounded-lg text-xs flex items-center space-x-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
};
