import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { AnalyzeRequestPayload, RewriteProjectPayload } from './src/types/careerlens.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(error: unknown): { status: number; message: string } {
  const err = error as { status?: number; message?: string; code?: number };
  const rawMessage = err?.message || 'An unexpected error occurred while analyzing your resume.';

  if (
    rawMessage.includes('API_KEY_INVALID') ||
    rawMessage.includes('PERMISSION_DENIED') ||
    rawMessage.includes('GEMINI_API_KEY is not configured')
  ) {
    return {
      status: 403,
      message: 'Gemini API key is missing or invalid. Please check your key in the Settings > Secrets panel.',
    };
  }

  if (rawMessage.includes('RESOURCE_EXHAUSTED') || err?.status === 429) {
    return {
      status: 429,
      message: 'Rate limit reached on the Gemini API. Please wait a moment and try again.',
    };
  }

  return {
    status: err?.status && err.status >= 400 && err.status < 600 ? err.status : 500,
    message: rawMessage,
  };
}

const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    candidateName: {
      type: Type.STRING,
      description: 'Candidate name extracted from the resume, or "Candidate" if not present.',
    },
    currentLevelEstimate: {
      type: Type.STRING,
      description: 'Concise assessment of current readiness (e.g., "Beginner", "Early Intermediate", "Intermediate").',
    },
    targetRole: {
      type: Type.STRING,
      description: 'Target job title inferred from the job description or user input.',
    },
    executiveSummary: {
      type: Type.STRING,
      description: '2-3 clear sentences summarizing resume alignment, main strengths, and highest-priority skill gaps.',
    },
    extractedResumePreview: {
      type: Type.STRING,
      description: 'Concise plain-text summary of the parsed resume sections (Education, Skills, Experience, Projects) so the user can verify PDF parsing accuracy.',
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 to 5 specific strengths observed in the resume relative to the job description.',
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          category: {
            type: Type.STRING,
            description: 'One of: Languages & Core, Frameworks & UI, Backend & Data, Cloud & Tooling, Collaboration & Process',
          },
          importance: {
            type: Type.STRING,
            description: 'Either "required" or "preferred"',
          },
          status: {
            type: Type.STRING,
            description: 'Either "matched", "partial", or "missing"',
          },
          resumeEvidence: {
            type: Type.STRING,
            description: 'Exact evidence found in the resume, or "No direct mention found in resume."',
          },
          jdRequirement: {
            type: Type.STRING,
            description: 'How the job description expects this skill to be applied.',
          },
          gapAction: {
            type: Type.STRING,
            description: 'Specific Beginner-to-Intermediate next action to strengthen or prove this skill.',
          },
        },
        required: ['id', 'name', 'category', 'importance', 'status', 'resumeEvidence', 'jdRequirement', 'gapAction'],
      },
      description: 'Comprehensive breakdown of 10 to 16 concrete skills extracted from the job description, compared against the resume.',
    },
    roadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          phase: {
            type: Type.STRING,
            description: 'Progressive phase label, e.g., "Phase 1: Core Foundations", "Phase 2: Practical Implementation", "Phase 3: Portfolio & Proof"',
          },
          title: { type: Type.STRING },
          targetSkills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          difficulty: {
            type: Type.STRING,
            description: 'Either "Beginner" or "Intermediate"',
          },
          estimatedHours: {
            type: Type.INTEGER,
            description: 'Realistic focused study & build hours for this step (between 3 and 20).',
          },
          objective: {
            type: Type.STRING,
            description: 'Plain-language explanation of what this milestone teaches and why the target role needs it.',
          },
          practiceTask: {
            type: Type.STRING,
            description: 'Concrete hands-on coding or deliverable exercise to build competence.',
          },
          verificationCriteria: {
            type: Type.STRING,
            description: 'Observable proof or checklist item confirming the user is ready to move on.',
          },
        },
        required: [
          'id',
          'phase',
          'title',
          'targetSkills',
          'difficulty',
          'estimatedHours',
          'objective',
          'practiceTask',
          'verificationCriteria',
        ],
      },
      description: 'Ordered 5 to 7 step learning roadmap progressing from Beginner foundations to Intermediate job-ready execution.',
    },
    projectRecommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          projectTitle: { type: Type.STRING },
          originalDescription: {
            type: Type.STRING,
            description: 'Original project or experience description extracted directly from the resume.',
          },
          diagnosis: {
            type: Type.STRING,
            description: 'Specific critique of what is vague, passive, or missing relative to the target job description.',
          },
          improvedDescription: {
            type: Type.STRING,
            description: 'Rewritten, impact-focused bullet points or description aligned with the JD without inventing fake achievements.',
          },
          highlightedKeywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Target job description keywords incorporated into the improved description.',
          },
          impactRationale: {
            type: Type.STRING,
            description: 'Why this rewrite strengthens recruiter and ATS alignment.',
          },
        },
        required: [
          'id',
          'projectTitle',
          'originalDescription',
          'diagnosis',
          'improvedDescription',
          'highlightedKeywords',
          'impactRationale',
        ],
      },
      description: 'Tailored rewrites for 2 to 4 projects or work experiences found on the resume. If no formal projects exist, suggest improvements to existing coursework or capstone items.',
    },
  },
  required: [
    'candidateName',
    'currentLevelEstimate',
    'targetRole',
    'executiveSummary',
    'extractedResumePreview',
    'strengths',
    'skills',
    'roadmap',
    'projectRecommendations',
  ],
};

const rewriteResponseSchema = {
  type: Type.OBJECT,
  properties: {
    diagnosis: { type: Type.STRING },
    improvedDescription: { type: Type.STRING },
    highlightedKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    impactRationale: { type: Type.STRING },
  },
  required: ['diagnosis', 'improvedDescription', 'highlightedKeywords', 'impactRationale'],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const body = req.body as AnalyzeRequestPayload;

      if (!body.jobDescription || body.jobDescription.trim().length < 30) {
        res.status(400).json({
          error: 'Please provide a complete job description (at least 30 characters) to compare against.',
        });
        return;
      }

      const hasFile = Boolean(body.resumeFile?.data && body.resumeFile?.mimeType);
      const hasText = Boolean(body.resumeText && body.resumeText.trim().length >= 30);

      if (!hasFile && !hasText) {
        res.status(400).json({
          error: 'Please upload a resume PDF/text file or paste your resume content.',
        });
        return;
      }

      const ai = getGeminiClient();

      const difficultyGuidance =
        body.difficultyTarget === 'beginner-to-intermediate'
          ? 'Calibrate explanations and the learning roadmap for a Beginner transitioning to Intermediate level: explain technical expectations in plain language, start with foundational practice, and bridge progressively to production-ready intermediate tasks.'
          : 'Calibrate explanations and the learning roadmap for an Intermediate practitioner becoming fully job-ready: focus on architectural trade-offs, testing, observability, and measurable engineering outcomes.';

      const promptText = [
        'Analyze the provided candidate resume against the target job description.',
        body.targetRole?.trim() ? `Target Role Hint: ${body.targetRole.trim()}` : '',
        difficultyGuidance,
        '',
        'Requirements:',
        '1. Extract key required and preferred skills from the job description (10-16 skills). Classify each honestly as "matched", "partial", or "missing" based strictly on evidence in the resume.',
        '2. Build a progressive 5-7 step learning roadmap focusing primarily on the "missing" and "partial" required skills, ordered from Beginner foundations to Intermediate practical deliverables.',
        '3. Extract the actual projects or technical work entries from the resume and recommend concrete, truthful improvements to their descriptions so they highlight measurable outcomes, technical ownership, and job-description terminology—never fabricate metrics or experience that contradicts the resume (use realistic placeholders like "[X%]" or "[N users]" only if advising the user to insert their own number, or reframe existing scope cleanly).',
        '',
        'Target Job Description:',
        body.jobDescription.trim(),
        '',
        hasText && !hasFile ? `Candidate Resume Text:\n${body.resumeText!.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      if (hasFile && body.resumeFile) {
        parts.push({
          inlineData: {
            mimeType: body.resumeFile.mimeType,
            data: body.resumeFile.data,
          },
        });
      }
      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'You are CareerLens, a rigorous technical career coach and curriculum designer. Return strictly valid JSON matching the requested schema. Be specific, constructive, honest about skill gaps, and supportive of Beginner-to-Intermediate learners.',
          responseMimeType: 'application/json',
          responseSchema: analysisResponseSchema,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MEDIUM,
          },
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        throw new Error('The model returned an empty response. Please try again.');
      }

      const parsed = JSON.parse(rawText);

      const normalized = {
        id: `analysis_${Date.now()}`,
        createdAt: new Date().toISOString(),
        candidateName: parsed.candidateName || 'Candidate',
        currentLevelEstimate: parsed.currentLevelEstimate || 'Beginner → Intermediate',
        targetRole: parsed.targetRole || body.targetRole?.trim() || 'Target Role',
        difficultyTarget: body.difficultyTarget || 'beginner-to-intermediate',
        resumeFileName: body.resumeFile?.name,
        executiveSummary: parsed.executiveSummary || '',
        extractedResumePreview: parsed.extractedResumePreview || '',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        skills: Array.isArray(parsed.skills)
          ? parsed.skills.map((s: Record<string, unknown>, idx: number) => ({
              id: String(s.id || `skill_${idx + 1}`),
              name: String(s.name || 'Unnamed Skill'),
              category: String(s.category || 'Technical'),
              importance: s.importance === 'preferred' ? 'preferred' : 'required',
              status: s.status === 'matched' || s.status === 'partial' || s.status === 'missing' ? s.status : 'missing',
              resumeEvidence: String(s.resumeEvidence || 'Not mentioned in resume.'),
              jdRequirement: String(s.jdRequirement || ''),
              gapAction: String(s.gapAction || ''),
            }))
          : [],
        roadmap: Array.isArray(parsed.roadmap)
          ? parsed.roadmap.map((r: Record<string, unknown>, idx: number) => ({
              id: String(r.id || `step_${idx + 1}`),
              phase: String(r.phase || 'Phase 1: Foundations'),
              title: String(r.title || `Step ${idx + 1}`),
              targetSkills: Array.isArray(r.targetSkills) ? r.targetSkills.map(String) : [],
              difficulty: r.difficulty === 'Intermediate' ? 'Intermediate' : 'Beginner',
              estimatedHours: Number(r.estimatedHours) || 6,
              objective: String(r.objective || ''),
              practiceTask: String(r.practiceTask || ''),
              verificationCriteria: String(r.verificationCriteria || ''),
            }))
          : [],
        projectRecommendations: Array.isArray(parsed.projectRecommendations)
          ? parsed.projectRecommendations.map((p: Record<string, unknown>, idx: number) => ({
              id: String(p.id || `proj_${idx + 1}`),
              projectTitle: String(p.projectTitle || `Project ${idx + 1}`),
              originalDescription: String(p.originalDescription || ''),
              diagnosis: String(p.diagnosis || ''),
              improvedDescription: String(p.improvedDescription || ''),
              highlightedKeywords: Array.isArray(p.highlightedKeywords) ? p.highlightedKeywords.map(String) : [],
              impactRationale: String(p.impactRationale || ''),
            }))
          : [],
      };

      res.json(normalized);
    } catch (error) {
      const formatted = formatGeminiError(error);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/rewrite-project', async (req, res) => {
    try {
      const body = req.body as RewriteProjectPayload;
      if (!body.projectTitle || !body.originalDescription || !body.jobDescription) {
        res.status(400).json({ error: 'Project title, original description, and job description are required.' });
        return;
      }

      const ai = getGeminiClient();

      const angleInstruction =
        body.focusAngle === 'impact-metrics'
          ? 'Focus on active engineering verbs, measurable impact framing, and concise 2-3 bullet formatting.'
          : body.focusAngle === 'missing-skills'
            ? `Focus on naturally bridging toward these target job skills where truthful to the project scope: ${body.missingSkills.join(', ')}. Suggest realistic extension points if a skill was not yet used.`
            : 'Focus on crisp, plain-English clarity ideal for a Beginner-to-Intermediate candidate so recruiters immediately grasp what was built, how it works, and why it matters.';

      const prompt = [
        `Project Title: ${body.projectTitle}`,
        `Original Resume Description:\n${body.originalDescription}`,
        '',
        `Target Job Description Excerpt:\n${body.jobDescription.slice(0, 2500)}`,
        '',
        `Rewrite Goal: ${angleInstruction}`,
        body.customNote?.trim() ? `Candidate's Additional Context/Note: ${body.customNote.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a technical resume editor. Rewrite the project description truthfully without inventing fake jobs or false metrics. Return strictly valid JSON.',
          responseMimeType: 'application/json',
          responseSchema: rewriteResponseSchema,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        throw new Error('Empty response returned while rewriting project description.');
      }

      res.json(JSON.parse(rawText));
    } catch (error) {
      const formatted = formatGeminiError(error);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareerLens server listening on http://localhost:${PORT}`);
  });
}

startServer();
