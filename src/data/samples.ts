import type { DifficultyTarget } from '../types/careerlens.ts';

export interface SamplePreset {
  id: string;
  label: string;
  targetRole: string;
  difficultyTarget: DifficultyTarget;
  resumeText: string;
  jobDescription: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'frontend-junior',
    label: 'Frontend Developer (Beginner → Intermediate)',
    targetRole: 'Junior Frontend Engineer (React & TypeScript)',
    difficultyTarget: 'beginner-to-intermediate',
    resumeText: `MAYA PATEL
Email: maya.patel@example.com | GitHub: github.com/mayapatel-dev

EDUCATION
B.S. in Computer Science, State University (Graduated May 2026)

TECHNICAL SKILLS
Languages: JavaScript (ES6+), HTML5, CSS3, basic SQL
Frameworks & Libraries: React, Tailwind CSS, Bootstrap
Tools: Git, GitHub, VS Code, Figma

PROJECTS
1. TaskTrackr Web App
- Built a to-do list website using React and CSS.
- Users can add, delete, and mark tasks as complete.
- Stored data in localStorage so tasks stay after refreshing the page.

2. Weather Dashboard
- Made a weather app that calls the OpenWeather API using fetch.
- Displayed temperature and 5-day forecast cards with responsive layout.

3. Campus Club Landing Page
- Helped design and build a static website for the robotics club using HTML and Bootstrap.
- Updated event dates and photos before club fair.`,
    jobDescription: `Junior Frontend Engineer — Product Studio

About the Role
We are looking for a Junior Frontend Engineer to help build accessible, data-rich web applications for our SaaS customers.

Requirements
- Solid proficiency in React (hooks, component composition, state management) and TypeScript.
- Strong command of modern CSS / Tailwind CSS and responsive, accessible UI patterns (WCAG AA, keyboard navigation, semantic HTML).
- Experience integrating REST APIs with loading, empty, and error state handling.
- Familiarity with client-side unit or component testing (Vitest or Jest + React Testing Library).
- Comfort working with Git pull requests, code reviews, and CI workflows.

Preferred / Nice to Have
- Experience with Next.js or Vite build tooling.
- Familiarity with form validation libraries (React Hook Form, Zod) and performance profiling.`,
  },
  {
    id: 'data-analyst-transition',
    label: 'Data Analyst (SQL & Python Gap Check)',
    targetRole: 'Junior Product Data Analyst',
    difficultyTarget: 'beginner-to-intermediate',
    resumeText: `DAVID CHEN
Email: david.chen@example.com | Portfolio: davidchendata.example.com

SUMMARY
Operations coordinator transitioning into product and business analytics with hands-on spreadsheet modeling and introductory SQL coursework.

EXPERIENCE
Operations Coordinator, Metro Logistics (2024 – Present)
- Maintained weekly Excel trackers for 140+ regional delivery routes.
- Created pivot tables to summarize late shipments for monthly operations meetings.

PROJECTS
1. Retail Sales Spreadsheet Analysis
- Analyzed a 10,000-row CSV dataset in Google Sheets and Excel.
- Built bar charts showing top-selling product categories by quarter.

2. SQL Library Database Exercise
- Wrote SELECT and JOIN queries in SQLite for a mock bookstore schema during an online course.

SKILLS
Excel (VLOOKUP, Pivot Tables), Google Sheets, basic SQL (SELECT, WHERE, JOIN), basic Python syntax.`,
    jobDescription: `Junior Product Data Analyst — SaaS Growth Team

Responsibilities & Requirements
- Write clean, performant SQL queries (CTEs, window functions, aggregations, multi-table joins) against PostgreSQL or BigQuery to answer product funnel questions.
- Use Python (pandas, numpy) or R for exploratory data analysis, data cleaning, and cohort retention modeling.
- Build interactive KPI dashboards in Tableau, Looker, or Power BI for product managers.
- Design and evaluate A/B experiments (conversion rates, statistical significance, sample size sanity checks).
- Communicate findings clearly in written memos with reproducible methodology.

Preferred
- Familiarity with dbt or Git version control for SQL transformations.`,
  },
];
