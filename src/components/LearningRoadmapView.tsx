import { useMemo, useState } from 'react';
import { CheckSquare, RotateCcw, Square } from 'lucide-react';
import type { AnalysisResult } from '../types/careerlens.ts';

interface LearningRoadmapViewProps {
  analysis: AnalysisResult;
  completedStepIds: string[];
  onToggleStep: (stepId: string) => void;
  onResetProgress: () => void;
}

export function LearningRoadmapView({
  analysis,
  completedStepIds,
  onToggleStep,
  onResetProgress,
}: LearningRoadmapViewProps) {
  const [filter, setFilter] = useState<'all' | 'remaining' | 'completed'>('all');

  const stats = useMemo(() => {
    const totalSteps = analysis.roadmap.length;
    const totalHours = analysis.roadmap.reduce((acc, s) => acc + s.estimatedHours, 0);
    const completedSteps = analysis.roadmap.filter((s) => completedStepIds.includes(s.id));
    const completedHours = completedSteps.reduce((acc, s) => acc + s.estimatedHours, 0);
    const percentComplete = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;

    return {
      totalSteps,
      completedCount: completedSteps.length,
      totalHours,
      completedHours,
      percentComplete,
    };
  }, [analysis.roadmap, completedStepIds]);

  const filteredSteps = useMemo(() => {
    return analysis.roadmap.filter((step) => {
      const done = completedStepIds.includes(step.id);
      if (filter === 'remaining') return !done;
      if (filter === 'completed') return done;
      return true;
    });
  }, [analysis.roadmap, completedStepIds, filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {analysis.targetRole} ·{' '}
            {analysis.difficultyTarget === 'beginner-to-intermediate'
              ? 'Beginner → Intermediate Track'
              : 'Intermediate → Job-Ready Track'}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Learning Roadmap
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', 'remaining', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filter === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'all' ? 'All Milestones' : tab === 'remaining' ? 'Remaining' : 'Completed'}
              </button>
            ))}
          </div>

          {stats.completedCount > 0 && (
            <button
              type="button"
              onClick={onResetProgress}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset Progress</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Summary Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Study Progress</p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
              {stats.completedCount} of {stats.totalSteps} milestones completed · {stats.completedHours} / {stats.totalHours} hrs finished
            </p>
          </div>
          <span className="text-lg font-semibold text-blue-700 font-mono tabular-nums">
            {stats.percentComplete}%
          </span>
        </div>

        <div className="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-700 transition-transform duration-300 origin-left"
            style={{ transform: `scaleX(${stats.percentComplete / 100})` }}
          />
        </div>
      </div>

      {/* Roadmap Steps */}
      {filteredSteps.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-slate-900">
            {filter === 'completed'
              ? 'No milestones marked complete yet'
              : 'All roadmap milestones are complete'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {filter === 'completed'
              ? 'Check off any milestone below as you complete its hands-on exercise.'
              : 'You have checked off every step in this learning plan.'}
          </p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="mt-4 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Show All Milestones
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSteps.map((step) => {
            const isCompleted = completedStepIds.includes(step.id);
            const stepIndex = analysis.roadmap.findIndex((r) => r.id === step.id) + 1;

            return (
              <article
                key={step.id}
                className={`border rounded-xl p-5 transition-colors ${
                  isCompleted
                    ? 'bg-slate-50/80 border-slate-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleStep(step.id)}
                      aria-pressed={isCompleted}
                      aria-label={isCompleted ? `Mark ${step.title} as incomplete` : `Mark ${step.title} as complete`}
                      className="mt-0.5 p-1 -ml-1 rounded-md text-slate-500 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shrink-0"
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500 font-mono tabular-nums">
                        {String(stepIndex).padStart(2, '0')} · {step.phase} · {step.difficulty} · {step.estimatedHours} hrs
                      </p>
                      <h2
                        className={`mt-1 text-base font-semibold ${
                          isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
                        }`}
                      >
                        {step.title}
                      </h2>
                      {step.targetSkills.length > 0 && (
                        <p className="mt-1 text-xs text-slate-600">
                          Focus skills: {step.targetSkills.join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-xs font-medium whitespace-nowrap shrink-0 ${
                      isCompleted ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {isCompleted ? 'Completed' : 'In Queue'}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs leading-relaxed">
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Why This Matters</p>
                    <p className="text-slate-700">{step.objective}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Hands-On Practice Task</p>
                    <p className="text-slate-700">{step.practiceTask}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Completion Check</p>
                    <p className="text-slate-700">{step.verificationCriteria}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
