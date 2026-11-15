import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  FileText,
  FileUp,
  Loader2,
  Trash2,
} from 'lucide-react';
import { SAMPLE_PRESETS, type SamplePreset } from '../data/samples.ts';
import type { AnalyzeRequestPayload, DifficultyTarget } from '../types/careerlens.ts';

interface AnalyzeWorkspaceProps {
  onAnalyze: (payload: AnalyzeRequestPayload) => Promise<void>;
  isAnalyzing: boolean;
  error: string | null;
  onClearError: () => void;
}

const MAX_FILE_BYTES = 12 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function AnalyzeWorkspace({
  onAnalyze,
  isAnalyzing,
  error,
  onClearError,
}: AnalyzeWorkspaceProps) {
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    mimeType: string;
    size: number;
    base64: string;
  } | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [difficultyTarget, setDifficultyTarget] = useState<DifficultyTarget>('beginner-to-intermediate');
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeError = localError || error;

  const clearErrors = () => {
    setLocalError(null);
    onClearError();
  };

  const handleFile = async (file: File) => {
    clearErrors();
    if (file.size > MAX_FILE_BYTES) {
      setLocalError('File exceeds the 12 MB limit. Please upload a smaller PDF or paste your resume text.');
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
    const isText =
      file.type.startsWith('text/') || lowerName.endsWith('.txt') || lowerName.endsWith('.md');

    if (!isPdf && !isText) {
      setLocalError('Unsupported file type. Please upload a PDF (.pdf), plain text (.txt), or Markdown (.md) resume.');
      return;
    }

    if (isText) {
      const text = await file.text();
      setSelectedFile(null);
      setResumeText(text);
      setInputMode('paste');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      if (!base64) {
        setLocalError('Could not read the selected PDF file. Please try another file.');
        return;
      }
      setSelectedFile({
        name: file.name,
        mimeType: 'application/pdf',
        size: file.size,
        base64,
      });
    };
    reader.onerror = () => {
      setLocalError('Failed to read the uploaded file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handlePresetLoad = (preset: SamplePreset) => {
    clearErrors();
    setSelectedFile(null);
    setInputMode('paste');
    setResumeText(preset.resumeText);
    setJobDescription(preset.jobDescription);
    setTargetRole(preset.targetRole);
    setDifficultyTarget(preset.difficultyTarget);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const hasFile = inputMode === 'upload' && selectedFile !== null;
    const hasText = resumeText.trim().length >= 30;

    if (!hasFile && !hasText) {
      setLocalError('Upload a PDF resume or paste at least 30 characters of resume content.');
      return;
    }

    if (jobDescription.trim().length < 30) {
      setLocalError('Paste the target job description (at least 30 characters) so CareerLens can compare requirements.');
      return;
    }

    await onAnalyze({
      resumeFile: hasFile && selectedFile
        ? {
            name: selectedFile.name,
            mimeType: selectedFile.mimeType,
            data: selectedFile.base64,
          }
        : undefined,
      resumeText: !hasFile ? resumeText.trim() : undefined,
      jobDescription: jobDescription.trim(),
      targetRole: targetRole.trim() || undefined,
      difficultyTarget,
    });
  };

  const jdWordCount = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0;
  const resumeWordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-5">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 text-balance">
            Compare your resume against a target job description
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Upload a PDF resume or paste your text alongside a job posting. CareerLens identifies skill gaps, builds a structured Beginner-to-Intermediate learning roadmap, and rewrites project bullets for stronger alignment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Quick test presets:</span>
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetLoad(preset)}
              disabled={isAnalyzing}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {activeError && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-900"
        >
          <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-medium text-red-900">Unable to run analysis</p>
            <p className="mt-0.5 text-red-800">{activeError}</p>
          </div>
          <button
            type="button"
            onClick={clearErrors}
            className="px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100 rounded-md whitespace-nowrap shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left Column: Resume Upload / Paste */}
          <section className="flex flex-col bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">1. Candidate Resume</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  PDF files are processed directly with Gemini multimodal document reading
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    inputMode === 'upload'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    inputMode === 'paste'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paste Text
                </button>
              </div>
            </div>

            {inputMode === 'upload' ? (
              <div className="flex-1 flex flex-col">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                  className="sr-only"
                  id="resume-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleFile(file);
                    }
                    e.target.value = '';
                  }}
                />

                {!selectedFile ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`flex-1 min-h-[260px] flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg transition-colors ${
                      isDragging
                        ? 'border-blue-600 bg-blue-50/60'
                        : 'border-slate-300 bg-slate-50/50 hover:border-slate-400'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center mb-3 text-slate-700">
                      <FileUp className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      Drop your resume PDF here, or browse from your device
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Supports PDF, TXT, or Markdown up to 12 MB
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 px-4 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      Choose Resume File
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-h-[260px] flex flex-col justify-between p-5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                          <FileText className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {selectedFile.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
                            PDF Document · {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        aria-label="Remove uploaded resume"
                        className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-emerald-700 font-medium">
                        Ready for Gemini PDF extraction
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 whitespace-nowrap shrink-0"
                      >
                        Replace PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <label htmlFor="resume-textarea" className="sr-only">
                  Resume text
                </label>
                <textarea
                  id="resume-textarea"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume sections here (skills, projects, coursework, experience)..."
                  className="flex-1 min-h-[260px] w-full p-3.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-y leading-relaxed"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono tabular-nums">{resumeWordCount} words</span>
                  {resumeText && (
                    <button
                      type="button"
                      onClick={() => setResumeText('')}
                      className="text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
                    >
                      Clear text
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Right Column: Target Job Description */}
          <section className="flex flex-col bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">2. Target Job Description</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste the full responsibilities and requirements from the posting
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {jdWordCount} words
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="target-role-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Target Role (optional)
                </label>
                <input
                  id="target-role-input"
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Junior Frontend Engineer"
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700 mb-1">
                  Roadmap Calibration
                </span>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDifficultyTarget('beginner-to-intermediate')}
                    className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                      difficultyTarget === 'beginner-to-intermediate'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Beginner → Interm.
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficultyTarget('intermediate-to-job-ready')}
                    className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                      difficultyTarget === 'intermediate-to-job-ready'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Interm. → Ready
                  </button>
                </div>
              </div>
            </div>

            <label htmlFor="jd-textarea" className="sr-only">
              Target job description
            </label>
            <textarea
              id="jd-textarea"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description responsibilities, required technical skills, and preferred qualifications..."
              className="flex-1 min-h-[200px] w-full p-3.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-y leading-relaxed"
            />
          </section>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-600">
            Analysis produces a structured skill matrix, phased Beginner → Intermediate learning plan, and project bullet rewrites.
          </div>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Analyzing Resume & Skill Gaps...</span>
              </>
            ) : (
              <>
                <span>Run Skill Gap Analysis</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
