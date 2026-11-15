import { useEffect, useState } from 'react';
import {
  Compass,
  Download,
  FileSearch,
  FolderClock,
  GitCompare,
  Menu,
  PenLine,
  Plus,
  X,
} from 'lucide-react';
import { AnalyzeWorkspace } from './components/AnalyzeWorkspace.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { LearningRoadmapView } from './components/LearningRoadmapView.tsx';
import { ProjectRewritesView } from './components/ProjectRewritesView.tsx';
import { SkillGapMatrix } from './components/SkillGapMatrix.tsx';
import type {
  AnalysisResult,
  AnalyzeRequestPayload,
  ProjectRecommendation,
} from './types/careerlens.ts';
import { downloadMarkdownReport } from './utils/exportReport.ts';

type WorkspaceTab = 'analyze' | 'gaps' | 'roadmap' | 'projects' | 'history';

const STORAGE_ANALYSES_KEY = 'careerlens.analyses.v1';
const STORAGE_PROGRESS_KEY = 'careerlens.roadmapProgress.v1';
const STORAGE_JD_KEY = 'careerlens.jobDescriptions.v1';

const TAB_LABELS: Record<WorkspaceTab, string> = {
  analyze: 'Upload & Compare',
  gaps: 'Skill Gap Matrix',
  roadmap: 'Learning Roadmap',
  projects: 'Project Rewrites',
  history: 'Saved Analyses',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('analyze');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [analyses, setAnalyses] = useState<AnalysisResult[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ANALYSES_KEY);
      return raw ? (JSON.parse(raw) as AnalysisResult[]) : [];
    } catch {
      return [];
    }
  });

  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ANALYSES_KEY);
      const list = raw ? (JSON.parse(raw) as AnalysisResult[]) : [];
      return list[0]?.id ?? null;
    } catch {
      return null;
    }
  });

  const [roadmapProgress, setRoadmapProgress] = useState<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PROGRESS_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    } catch {
      return {};
    }
  });

  const [jdByAnalysis, setJdByAnalysis] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_JD_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ANALYSES_KEY, JSON.stringify(analyses));
    } catch {
      // Storage quota ignored
    }
  }, [analyses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(roadmapProgress));
    } catch {
      // Storage quota ignored
    }
  }, [roadmapProgress]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_JD_KEY, JSON.stringify(jdByAnalysis));
    } catch {
      // Storage quota ignored
    }
  }, [jdByAnalysis]);

  const activeAnalysis = analyses.find((a) => a.id === activeAnalysisId) ?? null;

  const handleAnalyze = async (payload: AnalyzeRequestPayload) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume.');
      }

      const result = data as AnalysisResult;
      setAnalyses((prev) => [result, ...prev.slice(0, 14)]);
      setActiveAnalysisId(result.id);
      setJdByAnalysis((prev) => ({
        ...prev,
        [result.id]: payload.jobDescription,
      }));
      setActiveTab('gaps');
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : 'An unexpected error occurred during analysis.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleRoadmapStep = (stepId: string) => {
    if (!activeAnalysis) return;
    setRoadmapProgress((prev) => {
      const current = prev[activeAnalysis.id] || [];
      const next = current.includes(stepId)
        ? current.filter((id) => id !== stepId)
        : [...current, stepId];
      return { ...prev, [activeAnalysis.id]: next };
    });
  };

  const handleResetRoadmapProgress = () => {
    if (!activeAnalysis) return;
    setRoadmapProgress((prev) => ({ ...prev, [activeAnalysis.id]: [] }));
  };

  const handleUpdateProject = (projectId: string, updated: Partial<ProjectRecommendation>) => {
    if (!activeAnalysis) return;
    setAnalyses((prev) =>
      prev.map((item) => {
        if (item.id !== activeAnalysis.id) return item;
        return {
          ...item,
          projectRecommendations: item.projectRecommendations.map((proj) =>
            proj.id === projectId ? { ...proj, ...updated } : proj,
          ),
        };
      }),
    );
  };

  const handleDeleteAnalysis = (id: string) => {
    setAnalyses((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (activeAnalysisId === id) {
        setActiveAnalysisId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const navItems: Array<{
    id: WorkspaceTab;
    label: string;
    icon: typeof FileSearch;
    count?: number;
  }> = [
    { id: 'analyze', label: 'Upload & Compare', icon: FileSearch },
    {
      id: 'gaps',
      label: 'Skill Gap Matrix',
      icon: GitCompare,
      count: activeAnalysis?.skills.filter((s) => s.status === 'missing').length,
    },
    {
      id: 'roadmap',
      label: 'Learning Roadmap',
      icon: Compass,
      count: activeAnalysis?.roadmap.length,
    },
    {
      id: 'projects',
      label: 'Project Rewrites',
      icon: PenLine,
      count: activeAnalysis?.projectRecommendations.length,
    },
    {
      id: 'history',
      label: 'Saved Analyses',
      icon: FolderClock,
      count: analyses.length,
    },
  ];

  const selectTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const renderEmptyReportPrompt = (sectionName: string) => (
    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-xl mx-auto mt-6">
      <h1 className="text-lg font-semibold text-slate-900">No active analysis loaded</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        Upload a resume PDF or paste your resume alongside a target job description to populate {sectionName}.
      </p>
      <button
        type="button"
        onClick={() => setActiveTab('analyze')}
        className="mt-5 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 whitespace-nowrap"
      >
        Go to Upload & Compare
      </button>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
        <button
          type="button"
          onClick={() => selectTab('analyze')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          CareerLens
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation"
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav aria-label="Workspace navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span
                  className={`text-xs font-mono tabular-nums ${
                    isActive ? 'text-blue-700' : 'text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {activeAnalysis && (
        <div className="p-4 border-t border-slate-200 bg-slate-50/70">
          <p className="text-xs font-medium text-slate-500">Active Comparison</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-900 truncate">
            {activeAnalysis.targetRole}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 truncate">
            {activeAnalysis.candidateName}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/30"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on left, max 2 primary actions on right */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-medium text-slate-500 whitespace-nowrap shrink-0">
                CareerLens
              </span>
              <span className="text-slate-300" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 truncate">
                {TAB_LABELS[activeTab]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {activeAnalysis && activeTab !== 'analyze' && (
              <button
                type="button"
                onClick={() => downloadMarkdownReport(activeAnalysis)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Export Report</span>
              </button>
            )}
            {activeTab !== 'analyze' && (
              <button
                type="button"
                onClick={() => setActiveTab('analyze')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>New Analysis</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-6xl w-full mx-auto">
          {activeTab === 'analyze' && (
            <AnalyzeWorkspace
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              error={analysisError}
              onClearError={() => setAnalysisError(null)}
            />
          )}

          {activeTab === 'gaps' &&
            (activeAnalysis ? (
              <SkillGapMatrix
                analysis={activeAnalysis}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            ) : (
              renderEmptyReportPrompt('the Skill Gap Matrix')
            ))}

          {activeTab === 'roadmap' &&
            (activeAnalysis ? (
              <LearningRoadmapView
                analysis={activeAnalysis}
                completedStepIds={roadmapProgress[activeAnalysis.id] || []}
                onToggleStep={handleToggleRoadmapStep}
                onResetProgress={handleResetRoadmapProgress}
              />
            ) : (
              renderEmptyReportPrompt('your Learning Roadmap')
            ))}

          {activeTab === 'projects' &&
            (activeAnalysis ? (
              <ProjectRewritesView
                analysis={activeAnalysis}
                jobDescription={jdByAnalysis[activeAnalysis.id] || ''}
                onUpdateProject={handleUpdateProject}
              />
            ) : (
              renderEmptyReportPrompt('Project Description Recommendations')
            ))}

          {activeTab === 'history' && (
            <HistoryView
              history={analyses}
              activeAnalysisId={activeAnalysisId}
              onSelectAnalysis={(item) => {
                setActiveAnalysisId(item.id);
                setActiveTab('gaps');
              }}
              onDeleteAnalysis={handleDeleteAnalysis}
              onStartNew={() => setActiveTab('analyze')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
