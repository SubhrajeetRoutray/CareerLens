import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MinusCircle,
  Search,
} from 'lucide-react';
import type { AnalysisResult, SkillStatus } from '../types/careerlens.ts';

interface SkillGapMatrixProps {
  analysis: AnalysisResult;
  onNavigateTab: (tab: 'roadmap' | 'projects') => void;
}

export function SkillGapMatrix({ analysis, onNavigateTab }: SkillGapMatrixProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | SkillStatus>('all');
  const [importanceFilter, setImportanceFilter] = useState<'all' | 'required' | 'preferred'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showResumePreview, setShowResumePreview] = useState(false);

  const metrics = useMemo(() => {
    const total = analysis.skills.length;
    const matched = analysis.skills.filter((s) => s.status === 'matched').length;
    const partial = analysis.skills.filter((s) => s.status === 'partial').length;
    const missing = analysis.skills.filter((s) => s.status === 'missing').length;
    const missingRequired = analysis.skills.filter(
      (s) => s.status === 'missing' && s.importance === 'required',
    ).length;
    const alignmentPct = total > 0 ? Math.round(((matched + partial * 0.5) / total) * 100) : 0;
    const totalHours = analysis.roadmap.reduce((acc, r) => acc + r.estimatedHours, 0);

    return {
      total,
      matched,
      partial,
      missing,
      missingRequired,
      alignmentPct,
      totalHours,
    };
  }, [analysis]);

  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return analysis.skills.filter((skill) => {
      if (statusFilter !== 'all' && skill.status !== statusFilter) return false;
      if (importanceFilter !== 'all' && skill.importance !== importanceFilter) return false;
      if (
        q &&
        !skill.name.toLowerCase().includes(q) &&
        !skill.category.toLowerCase().includes(q) &&
        !skill.jdRequirement.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [analysis.skills, statusFilter, importanceFilter, searchQuery]);

  const renderStatusLabel = (status: SkillStatus) => {
    if (status === 'matched') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Matched</span>
        </span>
      );
    }
    if (status === 'partial') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <MinusCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Partial</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 whitespace-nowrap">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Missing</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {analysis.candidateName} · {analysis.currentLevelEstimate}
            {analysis.resumeFileName ? ` · ${analysis.resumeFileName}` : ''}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {analysis.targetRole}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('roadmap')}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            View Learning Roadmap
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('projects')}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            Project Rewrites
          </button>
        </div>
      </div>

      {/* 4-column KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Skill Coverage</p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {metrics.alignmentPct}%
          </p>
          <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            {metrics.matched} matched · {metrics.partial} partial · {metrics.total} total
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Missing Required Skills</p>
          <p className="mt-1.5 text-2xl font-semibold text-red-700 font-mono tabular-nums">
            {metrics.missingRequired}
          </p>
          <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            {metrics.missing} total gaps identified
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Partial Matches</p>
          <p className="mt-1.5 text-2xl font-semibold text-amber-700 font-mono tabular-nums">
            {metrics.partial}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Needs stronger project proof
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Roadmap Estimate</p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {metrics.totalHours} hrs
          </p>
          <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            {analysis.roadmap.length} guided milestones
          </p>
        </div>
      </div>

      {/* Executive Summary & Strengths */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white border border-slate-200 rounded-xl p-5">
        <div className="lg:col-span-2 space-y-2">
          <h2 className="text-sm font-semibold text-slate-900">Assessment Summary</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{analysis.executiveSummary}</p>

          {analysis.extractedResumePreview && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowResumePreview((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                <span>{showResumePreview ? 'Hide parsed resume text' : 'Inspect parsed resume text'}</span>
                {showResumePreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showResumePreview && (
                <pre className="mt-3 p-3.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto">
                  {analysis.extractedResumePreview}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="lg:border-l lg:border-slate-200 lg:pl-6 space-y-2">
          <h2 className="text-sm font-semibold text-slate-900">Verified Strengths</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            {analysis.strengths.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* High-Density Skill Comparison Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Skill Gap Matrix</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare every job requirement against evidence found in your resume
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter skills..."
                aria-label="Filter skills"
                className="pl-8 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 w-44"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['all', 'missing', 'partial', 'matched'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    statusFilter === status
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status === 'all'
                    ? 'All'
                    : status === 'missing'
                      ? 'Missing'
                      : status === 'partial'
                        ? 'Partial'
                        : 'Matched'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['all', 'required', 'preferred'] as const).map((imp) => (
                <button
                  key={imp}
                  type="button"
                  onClick={() => setImportanceFilter(imp)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    importanceFilter === imp
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {imp === 'all' ? 'Any Priority' : imp === 'required' ? 'Required' : 'Preferred'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredSkills.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-900">No skills match your current filter</p>
            <p className="mt-1 text-xs text-slate-500">
              Adjust your search term or reset status filters to inspect all {analysis.skills.length} extracted requirements.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setImportanceFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4 w-56">Skill & Context</th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4 min-w-[220px]">Resume Evidence</th>
                  <th className="py-3 px-4 min-w-[260px]">Job Expectation & Next Step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredSkills.map((skill) => (
                  <tr key={skill.id} className="hover:bg-slate-50/70 transition-colors align-top">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-900">{skill.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {skill.category} · {skill.importance === 'required' ? 'Required' : 'Preferred'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">{renderStatusLabel(skill.status)}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 leading-relaxed">
                      {skill.resumeEvidence}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 leading-relaxed space-y-1.5">
                      <p className="text-slate-600">{skill.jdRequirement}</p>
                      <p className="font-medium text-slate-900">
                        Action: <span className="font-normal text-slate-700">{skill.gapAction}</span>
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
