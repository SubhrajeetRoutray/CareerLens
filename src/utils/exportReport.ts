import type { AnalysisResult } from '../types/careerlens.ts';

export function buildMarkdownReport(analysis: AnalysisResult): string {
  const matched = analysis.skills.filter((s) => s.status === 'matched').length;
  const partial = analysis.skills.filter((s) => s.status === 'partial').length;
  const missing = analysis.skills.filter((s) => s.status === 'missing').length;
  const total = analysis.skills.length || 1;
  const coverage = Math.round(((matched + partial * 0.5) / total) * 100);
  const totalHours = analysis.roadmap.reduce((acc, step) => acc + step.estimatedHours, 0);

  const lines: string[] = [
    `# CareerLens Skill Gap Report: ${analysis.targetRole}`,
    '',
    `- **Candidate:** ${analysis.candidateName}`,
    `- **Current Level Estimate:** ${analysis.currentLevelEstimate}`,
    `- **Target Track:** ${analysis.difficultyTarget === 'beginner-to-intermediate' ? 'Beginner to Intermediate' : 'Intermediate to Job-Ready'}`,
    `- **Skill Coverage:** ${coverage}% (${matched} matched, ${partial} partial, ${missing} missing out of ${analysis.skills.length})`,
    `- **Estimated Roadmap Effort:** ${totalHours} hours`,
    `- **Generated:** ${new Date(analysis.createdAt).toLocaleString()}`,
    '',
    '## Executive Summary',
    analysis.executiveSummary,
    '',
    '## Key Strengths',
    ...analysis.strengths.map((s) => `- ${s}`),
    '',
    '## Skill Gap Breakdown',
    '| Skill | Category | Importance | Status | Resume Evidence | Next Action |',
    '| --- | --- | --- | --- | --- | --- |',
    ...analysis.skills.map(
      (s) =>
        `| ${s.name} | ${s.category} | ${s.importance} | ${s.status.toUpperCase()} | ${s.resumeEvidence.replace(/\|/g, '/')} | ${s.gapAction.replace(/\|/g, '/')} |`,
    ),
    '',
    '## Learning Roadmap',
    ...analysis.roadmap.flatMap((step, index) => [
      `### ${index + 1}. ${step.title} (${step.phase} · ${step.difficulty} · ${step.estimatedHours} hrs)`,
      `- **Target Skills:** ${step.targetSkills.join(', ')}`,
      `- **Objective:** ${step.objective}`,
      `- **Hands-on Practice:** ${step.practiceTask}`,
      `- **Verification:** ${step.verificationCriteria}`,
      '',
    ]),
    '## Project Description Recommendations',
    ...analysis.projectRecommendations.flatMap((proj) => [
      `### ${proj.projectTitle}`,
      `**Original:**`,
      proj.originalDescription,
      '',
      `**Diagnosis:** ${proj.diagnosis}`,
      '',
      `**Improved Version:**`,
      proj.improvedDescription,
      '',
      `**Target Keywords:** ${proj.highlightedKeywords.join(', ')}`,
      `**Why It Works:** ${proj.impactRationale}`,
      '',
    ]),
  ];

  return lines.join('\n');
}

export function downloadMarkdownReport(analysis: AnalysisResult): void {
  const markdown = buildMarkdownReport(analysis);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeRole = analysis.targetRole
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  link.href = url;
  link.download = `careerlens-${safeRole || 'report'}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
