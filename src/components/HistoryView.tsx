import { ArrowUpRight, Trash2 } from 'lucide-react';
import type { AnalysisResult } from '../types/careerlens.ts';

interface HistoryViewProps {
  history: AnalysisResult[];
  activeAnalysisId: string | null;
  onSelectAnalysis: (analysis: AnalysisResult) => void;
  onDeleteAnalysis: (id: string) => void;
  onStartNew: () => void;
}

export function HistoryView({
  history,
  activeAnalysisId,
  onSelectAnalysis,
  onDeleteAnalysis,
  onStartNew,
}: HistoryViewProps) {
  const computeAlignment = (item: AnalysisResult) => {
    const total = item.skills.length || 1;
    const matched = item.skills.filter((s) => s.status === 'matched').length;
    const partial = item.skills.filter((s) => s.status === 'partial').length;
    return Math.round(((matched + partial * 0.5) / total) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Saved Analyses
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Compare your resume across different job postings stored locally in this browser.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNew}
          className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
        >
          New Comparison
        </button>
      </div>

      {history.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm font-semibold text-slate-900">No saved comparisons yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Upload a resume and compare it with a job description to save your skill gap matrix, roadmap, and project rewrites here.
          </p>
          <button
            type="button"
            onClick={onStartNew}
            className="mt-5 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
          >
            Analyze First Resume
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Target Role</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4 text-right">Skill Coverage</th>
                  <th className="py-3 px-4 text-right">Missing Skills</th>
                  <th className="py-3 px-4">Analyzed</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {history.map((item) => {
                  const pct = computeAlignment(item);
                  const missingCount = item.skills.filter((s) => s.status === 'missing').length;
                  const isActive = item.id === activeAnalysisId;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${isActive ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900">{item.targetRole}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.resumeFileName ? item.resumeFileName : 'Pasted Resume'} · {item.currentLevelEstimate}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {item.candidateName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs font-semibold text-slate-900">
                        {pct}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-red-700">
                        {missingCount}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectAnalysis(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
                          >
                            <span>Open</span>
                            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteAnalysis(item.id)}
                            aria-label={`Delete analysis for ${item.targetRole}`}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
