import { useState } from 'react';
import { Check, Copy, Loader2, RefreshCw } from 'lucide-react';
import type { AnalysisResult, ProjectRecommendation, RewriteProjectPayload } from '../types/careerlens.ts';

interface ProjectRewritesViewProps {
  analysis: AnalysisResult;
  jobDescription: string;
  onUpdateProject: (projectId: string, updated: Partial<ProjectRecommendation>) => void;
}

export function ProjectRewritesView({
  analysis,
  jobDescription,
  onUpdateProject,
}: ProjectRewritesViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refiningId, setRefiningId] = useState<string | null>(null);
  const [notesByProject, setNotesByProject] = useState<Record<string, string>>({});
  const [anglesByProject, setAnglesByProject] = useState<
    Record<string, RewriteProjectPayload['focusAngle']>
  >({});
  const [errorByProject, setErrorByProject] = useState<Record<string, string>>({});

  const missingSkillNames = analysis.skills
    .filter((s) => s.status === 'missing' || s.status === 'partial')
    .map((s) => s.name);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1800);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const handleRefine = async (project: ProjectRecommendation) => {
    setRefiningId(project.id);
    setErrorByProject((prev) => ({ ...prev, [project.id]: '' }));

    const focusAngle = anglesByProject[project.id] || 'impact-metrics';
    const customNote = notesByProject[project.id] || '';

    try {
      const response = await fetch('/api/rewrite-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: project.projectTitle,
          originalDescription: project.originalDescription,
          jobDescription: jobDescription || analysis.executiveSummary,
          missingSkills: missingSkillNames,
          focusAngle,
          customNote,
        } satisfies RewriteProjectPayload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not refine project description.');
      }

      onUpdateProject(project.id, {
        diagnosis: data.diagnosis,
        improvedDescription: data.improvedDescription,
        highlightedKeywords: Array.isArray(data.highlightedKeywords)
          ? data.highlightedKeywords
          : project.highlightedKeywords,
        impactRationale: data.impactRationale,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to refine right now.';
      setErrorByProject((prev) => ({ ...prev, [project.id]: msg }));
    } finally {
      setRefiningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-medium text-slate-500">
          {analysis.targetRole} · {analysis.projectRecommendations.length} project items reviewed
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Project Description Improvements
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-3xl">
          Side-by-side recommendations that translate existing coursework and side projects into outcome-oriented descriptions aligned with the target job posting.
        </p>
      </div>

      {analysis.projectRecommendations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-slate-900">
            No project sections were detected in the uploaded resume
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Add 1–3 projects or technical assignments to your resume and run a fresh analysis to receive tailored bullet rewrites.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {analysis.projectRecommendations.map((project, index) => {
            const isRefining = refiningId === project.id;
            const currentAngle = anglesByProject[project.id] || 'impact-metrics';
            const projectError = errorByProject[project.id];

            return (
              <article
                key={project.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-slate-500 tabular-nums">
                      Project {String(index + 1).padStart(2, '0')}
                    </p>
                    <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
                      {project.projectTitle}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleCopy(project.id, project.improvedDescription)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                  >
                    {copiedId === project.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                        <span className="text-emerald-700">Copied Rewrite</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Copy Rewrite</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                  <div className="p-5 space-y-3 bg-slate-50/50">
                    <h3 className="text-xs font-semibold text-slate-500">Original Resume Text</h3>
                    <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {project.originalDescription}
                    </p>
                    <div className="pt-3 border-t border-slate-200/80">
                      <p className="text-xs font-semibold text-slate-900">What to Strengthen</p>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {project.diagnosis}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="text-xs font-semibold text-blue-700">Recommended Rewrite</h3>
                    <p className="text-sm text-slate-900 whitespace-pre-line leading-relaxed font-medium">
                      {project.improvedDescription}
                    </p>
                    <div className="pt-3 border-t border-slate-200/80 space-y-2">
                      {project.highlightedKeywords.length > 0 && (
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-900">Keywords aligned: </span>
                          <span className="font-mono text-slate-700">
                            {project.highlightedKeywords.join(' · ')}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-900">Why it works: </span>
                        {project.impactRationale}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Refinement Toolbar */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col xl:flex-row xl:items-center gap-3">
                  <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg shrink-0">
                    {(
                      [
                        { id: 'impact-metrics', label: 'Impact & Scope' },
                        { id: 'missing-skills', label: 'Bridge Gaps' },
                        { id: 'clarity-beginner', label: 'Plain Clarity' },
                      ] as const
                    ).map((angle) => (
                      <button
                        key={angle.id}
                        type="button"
                        onClick={() =>
                          setAnglesByProject((prev) => ({ ...prev, [project.id]: angle.id }))
                        }
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          currentAngle === angle.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {angle.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={notesByProject[project.id] || ''}
                    onChange={(e) =>
                      setNotesByProject((prev) => ({ ...prev, [project.id]: e.target.value }))
                    }
                    placeholder="Optional detail to include (e.g., 120 weekly users, added Vitest tests)..."
                    aria-label={`Additional context for ${project.projectTitle}`}
                    className="flex-1 min-w-0 px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />

                  <button
                    type="button"
                    onClick={() => void handleRefine(project)}
                    disabled={isRefining}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
                  >
                    {isRefining ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        <span>Refining...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Regenerate Rewrite</span>
                      </>
                    )}
                  </button>
                </div>

                {projectError && (
                  <p className="px-4 py-2.5 text-xs text-red-700 bg-red-50 border-t border-red-200">
                    {projectError}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
