import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI SDK
// If the key is missing, we will output realistic mock data as a graceful fallback.
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini API service initialized with API Key.');
  } catch (err) {
    console.error('Failed to initialize GoogleGenerativeAI:', err.message);
  }
} else {
  console.warn('GEMINI_API_KEY environment variable not set. Running in MOCK FALLBACK mode.');
}

// Helper to run a generation with JSON format forcing
async function generateJSON(prompt, systemInstruction = '') {
  if (!genAI) {
    throw new Error('Gemini API is not configured. (Missing GEMINI_API_KEY)');
  }
  
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemInstruction,
  });

  const result = await model.generateContent({
    contents: prompt,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const responseText = result.response.text();
  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse Gemini JSON output:', responseText);
    throw new Error('AI response was not in the expected JSON format.');
  }
}

// Helper for standard chat text completion
async function generateText(prompt, systemInstruction = '') {
  if (!genAI) {
    throw new Error('Gemini API is not configured. (Missing GEMINI_API_KEY)');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemInstruction,
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/* ==========================================================================
   1. CAREER ROADMAP GENERATOR
   ========================================================================== */
export const generateRoadmap = async (role, level, timeline) => {
  if (!genAI) {
    return getMockRoadmap(role, level, timeline);
  }

  const systemPrompt = `You are a Career Path Optimization Specialist. Output your plan strictly in JSON format.
The JSON must follow this schema:
{
  "role": "string",
  "level": "string",
  "timeline": "string",
  "summary": "string",
  "milestones": [
    {
      "id": 1,
      "title": "string",
      "duration": "string",
      "description": "string",
      "key_skills": ["string"],
      "action_items": ["string"],
      "resources": [{"name": "string", "type": "string", "url": "string"}]
    }
  ]
}`;

  const prompt = `Create a structured career roadmap to transition into or advance as a "${role}" starting from experience level "${level}", with a target timeline of "${timeline}". Define at least 4 clear progressive milestones, including key skills, exact actions to take, and recommended study resources (e.g. documentation, tutorials, courses).`;

  return await generateJSON(prompt, systemPrompt);
};

/* ==========================================================================
   2. RESUME ANALYSIS
   ========================================================================== */
export const analyzeResume = async (resumeText, targetRole) => {
  if (!genAI) {
    return getMockResumeAnalysis(resumeText, targetRole);
  }

  const systemPrompt = `You are an expert Technical Recruiter and Resume Consultant. Evaluate the resume text against the target role and output a comprehensive feedback report strictly in JSON format.
The JSON must follow this schema:
{
  "score": 85, // 0-100 score
  "target_role": "string",
  "strengths": ["string"],
  "gaps": ["string"],
  "bullet_improvements": [
    {
      "original": "string",
      "revised": "string",
      "impact_reason": "string"
    }
  ],
  "formatting_tips": ["string"],
  "skills_found": ["string"],
  "skills_missing": ["string"]
}`;

  const prompt = `Analyze this resume content relative to the target career role: "${targetRole || 'Software Engineer'}".
Resume Text:
"""
${resumeText}
"""
Provide clear scores, bullet point rewrites using action verbs and quantifiable metrics (following the Google X-Y-Z formula), missing key terms, and formatting suggestions.`;

  return await generateJSON(prompt, systemPrompt);
};

/* ==========================================================================
   3. COVER LETTER GENERATOR
   ========================================================================== */
export const generateCoverLetter = async (resumeText, jobDescription, tone = 'Professional') => {
  if (!genAI) {
    return getMockCoverLetter(resumeText, jobDescription, tone);
  }

  const systemPrompt = `You are an expert copywriter specializing in job application cover letters.
Write a personalized, compelling cover letter that highlights how the candidate's skills map directly to the job requirements.
Output your response strictly in JSON format matching this schema:
{
  "subject": "string",
  "salutation": "string",
  "body_paragraphs": ["string"],
  "sign_off": "string",
  "full_letter": "string"
}`;

  const prompt = `Create a cover letter with a "${tone}" tone based on this user profile/resume:
"""
${resumeText}
"""
And this target Job Description:
"""
${jobDescription}
"""`;

  return await generateJSON(prompt, systemPrompt);
};

/* ==========================================================================
   4. LINKEDIN HEADLINE & PROFILE OPTIMIZER
   ========================================================================== */
export const generateLinkedInOptimizer = async (resumeText, targetRole) => {
  if (!genAI) {
    return getMockLinkedInOptimizer(resumeText, targetRole);
  }

  const systemPrompt = `You are a LinkedIn Branding Coach. Help optimize the user's profile presence. Output strictly in JSON format.
Schema:
{
  "headlines": ["string"], // Provide 5 distinct choices (e.g. keyword-rich, achievement-oriented, direct, conversational, etc.)
  "about_summary": "string", // A compelling 3-paragraph summary using hooks and list of key skills
  "profile_tips": ["string"] // Profile improvements tips
}`;

  const prompt = `Based on the user's details and target role "${targetRole}":
Resume:
"""
${resumeText}
"""
Generate high-conversion headlines and a customized LinkedIn "About" section that attracts recruiters.`;

  return await generateJSON(prompt, systemPrompt);
};

/* ==========================================================================
   5. SKILL GAP ANALYSIS
   ========================================================================== */
export const analyzeSkillGap = async (resumeText, targetRole, jobDescription) => {
  if (!genAI) {
    return getMockSkillGapAnalysis(resumeText, targetRole, jobDescription);
  }

  const systemPrompt = `You are a Skill Strategy consultant. Compare the candidate's experience with the job description and output a details gap analysis in JSON.
Schema:
{
  "match_percentage": 65, // 0-100
  "matching_skills": ["string"],
  "missing_skills": [
    {
      "skill": "string",
      "priority": "Critical" | "Preferred" | "Optional",
      "learning_difficulty": "Easy" | "Medium" | "Hard",
      "description": "string"
    }
  ],
  "bridging_recommendations": ["string"]
}`;

  const prompt = `Compare this candidate's resume/skills:
"""
${resumeText}
"""
With this target job description for a "${targetRole}":
"""
${jobDescription}
"""
Identify exactly what critical skills are missing and provide actionable recommendations to bridge the gap.`;

  return await generateJSON(prompt, systemPrompt);
};

/* ==========================================================================
   6. DAILY LEARNING PLAN
   ========================================================================== */
export const generateLearningPlan = async (skillsToLearn, currentLevel = 'Beginner') => {
  if (!genAI) {
    return getMockLearningPlan(skillsToLearn, currentLevel);
  }

  const systemPrompt = `You are an expert Educational Curriculum Designer. Generate a high-yield learning plan strictly in JSON format.
Schema:
{
  "plan_name": "string",
  "duration_weeks": 2,
  "daily_tasks": [
    {
      "day": 1,
      "week": 1,
      "topic": "string",
      "estimated_minutes": 45,
      "sub_tasks": ["string"],
      "resources": ["string"],
      "quiz": {
        "question": "string",
        "options": ["string"],
        "answer_index": 0,
        "explanation": "string"
      }
    }
  ]
}`;

  const prompt = `Create a daily learning schedule to master the following skills or bridge these gaps: "${skillsToLearn}".
Current candidate proficiency: "${currentLevel}".
Generate a structured 7-day learning block (Day 1 to Day 7) including daily subtopics, recommended study durations, resources, and a single multiple-choice self-test question for each day's task to check understanding.`;

  return await generateJSON(prompt, systemPrompt);
};

/* ==========================================================================
   7. MOCK INTERVIEW EVALUATOR & QUESTION GENERATOR
   ========================================================================== */
export const startMockInterview = async (role, type = 'Technical') => {
  if (!genAI) {
    return getMockInterviewQuestions(role, type);
  }

  const systemPrompt = `You are an elite interviewer conducting a ${type} interview for a "${role}" position.
Generate a set of 5 progressive questions. Output strictly in JSON format matching this schema:
{
  "role": "string",
  "type": "string",
  "questions": [
    {
      "id": 1,
      "question": "string",
      "intent": "What is the interviewer looking for?",
      "difficulty": "Easy" | "Medium" | "Hard"
    }
  ]
}`;

  const prompt = `Create a list of 5 standard interview questions for a "${role}" role. Ensure they cover realistic, situational, or code-logical domains matching the ${type} category.`;

  return await generateJSON(prompt, systemPrompt);
};

export const evaluateInterviewResponse = async (question, userResponse) => {
  if (!genAI) {
    return getMockInterviewEvaluation(question, userResponse);
  }

  const systemPrompt = `You are a Senior Hiring Manager. Evaluate the user's interview answer and generate structured feedback strictly in JSON.
Schema:
{
  "score": 78, // 0-100 score
  "feedback_summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "revised_better_version": "string",
  "rating": "Strong Pass" | "Pass" | "Borderline" | "Fail"
}`;

  const prompt = `Evaluate the candidate's response to the interview question.
Question: "${question}"
Candidate Response: "${userResponse}"
Provide constructive critique, points to include, and a revised, high-impact answer.`;

  return await generateJSON(prompt, systemPrompt);
};

/* ==========================================================================
   8. CODING QUESTIONS & EVALUATOR
   ========================================================================== */
export const getCodingQuestions = async (topic = 'Algorithms', difficulty = 'Medium') => {
  if (!genAI) {
    return getMockCodingQuestions(topic, difficulty);
  }

  const systemPrompt = `You are a Technical Interview Committee Leader. Generate a coding challenge strictly in JSON format.
Schema:
{
  "title": "string",
  "topic": "string",
  "difficulty": "string",
  "problem_statement": "string",
  "constraints": ["string"],
  "examples": [
    {
      "input": "string",
      "output": "string",
      "explanation": "string"
    }
  ],
  "starter_code": {
    "javascript": "string",
    "python": "string",
    "cpp": "string"
  }
}`;

  const prompt = `Generate a ${difficulty}-level coding problem related to "${topic}". Include detailed requirements, examples, and starter function templates for JavaScript, Python, and C++.`;

  return await generateJSON(prompt, systemPrompt);
};

export const evaluateCodeSubmission = async (problemTitle, code, language) => {
  if (!genAI) {
    return getMockCodeEvaluation(problemTitle, code, language);
  }

  const systemPrompt = `You are an automated code analysis engine powered by Gemini. Assess the efficiency, correctness, complexity, and safety of the submitted solution. Output strictly in JSON format.
Schema:
{
  "is_correct": true,
  "time_complexity": "string",
  "space_complexity": "string",
  "issues_found": ["string"],
  "review": "string",
  "optimized_code": "string",
  "score": 90 // 0-100
}`;

  const prompt = `Evaluate the following code submission for the problem "${problemTitle}".
Language: ${language}
Code:
\`\`\`${language}
${code}
\`\`\`
Provide detailed evaluation on logic, algorithmic runtime, and a cleaner rewrite.`;

  return await generateJSON(prompt, systemPrompt);
};

/* ==========================================================================
   9. SALARY INSIGHTS
   ========================================================================== */
export const getSalaryInsights = async (role, location = 'United States') => {
  if (!genAI) {
    return getMockSalaryInsights(role, location);
  }

  const systemPrompt = `You are a Global Compensation Strategy Advisor. Provide realistic compensation ranges and insights. Output strictly in JSON format.
Schema:
{
  "role": "string",
  "location": "string",
  "currency": "string",
  "ranges": {
    "entry": { "min": 50000, "median": 70000, "max": 90000 },
    "mid": { "min": 85000, "median": 110000, "max": 135000 },
    "senior": { "min": 130000, "median": 165000, "max": 220000 }
  },
  "benefits": ["string"],
  "market_demand": "High" | "Moderate" | "Growing",
  "negotiation_tips": ["string"]
}`;

  const prompt = `Generate salary insight percentiles and standard perks for the role of "${role}" in the region "${location}". Include negotiation recommendations specific to current market demand.`;

  return await generateJSON(prompt, systemPrompt);
};

/* ==========================================================================
   10. CHAT ASSISTANT
   ========================================================================== */
export const getChatAssistantResponse = async (history, message, profile = {}) => {
  if (!genAI) {
    return "This is a mock advisor response. Connect a GEMINI_API_KEY in the backend to speak with the real Gemini Career Advisor.";
  }

  const systemInstruction = `You are a highly skilled AI Career Coach, Recruiter, and Corporate Success Mentor.
Your tone is professional, encouraging, analytical, and highly structured.
You should leverage the user's target role (${profile.target_role || 'Not specified'}) and experience level (${profile.experience_level || 'Not specified'}) to tailor your answers.
Use bullet points, bold sections, and checklists to make your advice clear and easy to read.`;

  // Construct history in standard Generative AI format
  // Gemini expects: contents: [{role: 'user'|'model', parts: [{text: '...'}]}]
  const contents = [];
  
  // Format the older history (excluding current message)
  // Format is: { id, user_id, message, sender, created_at }
  // We need user -> user, ai -> model
  for (const item of history) {
    contents.push({
      role: item.sender === 'user' ? 'user' : 'model',
      parts: [{ text: item.message }]
    });
  }

  // Add the current message
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemInstruction,
  });

  const result = await model.generateContent({
    contents: contents
  });

  return result.response.text();
};


/* ==========================================================================
   MOCK GENERATOR FALLBACKS
   ========================================================================== */

function getMockRoadmap(role, level, timeline) {
  return {
    role,
    level,
    timeline,
    summary: `Structured development roadmap to excel as a ${role} over the course of ${timeline}. Focused on building foundational skills, gaining hands-on project experience, and preparing for job placement.`,
    milestones: [
      {
        id: 1,
        title: "Foundations and Fundamentals",
        duration: "Week 1-3",
        description: "Focus on understanding core theories, syntax, and tooling required for this domain.",
        key_skills: ["Basic tools", "Syntax", "Environment setup"],
        action_items: ["Install development environment", "Complete introductory online documentation modules", "Build a hello-world template"],
        resources: [
          { name: "Official Documentation Reference", type: "Docs", url: "https://example.com/docs" },
          { name: "Introductory Fundamentals Course", type: "Video Tutorial", url: "https://example.com/course" }
        ]
      },
      {
        id: 2,
        title: "Intermediate Concept Mastery",
        duration: "Week 4-6",
        description: "Dive deeper into structural architectural design, database hooks, or specific workflows.",
        key_skills: ["Data flow", "State management", "DB connectivity"],
        action_items: ["Build a CRUD layout application", "Read about performance design models", "Configure database bindings"],
        resources: [
          { name: "Architectural Deep Dive Series", type: "Blog", url: "https://example.com/blog" }
        ]
      },
      {
        id: 3,
        title: "Advanced Projects & Deployments",
        duration: "Week 7-9",
        description: "Combine all skills to build a complete project featuring full authentication, error handling, and cloud deployments.",
        key_skills: ["CI/CD pipelines", "Security auth hooks", "Performance optimization"],
        action_items: ["Implement user authentication and sessions", "Deploy code to a cloud environment (Vercel/Heroku/AWS)", "Run test coverage scripts"],
        resources: [
          { name: "Production Deployment Practices", type: "Guide", url: "https://example.com/deploy" }
        ]
      },
      {
        id: 4,
        title: "Job Readiness & Portfolio Review",
        duration: "Week 10-12",
        description: "Polish resume, structure portfolio representations, and engage in targeted interview practice.",
        key_skills: ["Interview communication", "Resume formatting", "System designs"],
        action_items: ["Build public portfolio website", "Optimize LinkedIn profile sections", "Practice 10 mock coding and behavioral challenges"],
        resources: [
          { name: "Tech Interview preparation list", type: "Handbook", url: "https://example.com/interview" }
        ]
      }
    ]
  };
}

function getMockResumeAnalysis(resumeText, targetRole) {
  return {
    score: 68,
    target_role: targetRole || "Software Engineer",
    strengths: [
      "Good foundational technical skill listings.",
      "Clear chronological job history structure.",
      "Demonstrates solid teamwork experience."
    ],
    gaps: [
      "Lack of quantifiable business metrics and outcomes in task listings.",
      "Vague descriptions for core accomplishments (needs action verbs).",
      "Missing relevant industry-specific keywords like 'CI/CD' or 'Agile methodologies'."
    ],
    bullet_improvements: [
      {
        original: "Responsible for fixing bugs in the core front-end project files.",
        revised: "Redesigned React front-end error-handling architecture, resolving 45+ critical bugs and improving customer checkout page load speeds by 23%.",
        impact_reason: "Replaces 'responsible for' with a strong verb, highlights the direct technical action, and adds quantifiable results."
      },
      {
        original: "Worked on setting up the server database and helped the backend team.",
        revised: "Collaborated in database migrations to PostgreSQL, optimizing lookup query indices which reduced server response times by 350ms.",
        impact_reason: "Shows technical depth, collaboration context, and measures database improvement performance metrics."
      }
    ],
    formatting_tips: [
      "Keep the resume strictly to 1 page if under 5 years of experience.",
      "Replace the generic 'Summary' statement with a 'Core Professional Highlight' focusing on target role metrics."
    ],
    skills_found: ["JavaScript", "HTML/CSS", "React", "Node.js", "SQL"],
    skills_missing: ["Docker", "TypeScript", "CI/CD", "AWS", "Agile Methodologies"]
  };
}

function getMockCoverLetter(resumeText, jobDescription, tone) {
  return {
    subject: "Application for Open Role position",
    salutation: "Dear Hiring Team,",
    body_paragraphs: [
      `I am writing to express my strong interest in joining your team. Based on my experience and technical backgrounds, I believe I can make immediate, high-quality contributions as a member of your company.`,
      `In my past work, I have focused on writing scalable systems and collaborating closely with design groups to build interfaces. Aligning my skills directly with your job description, I am excited about the opportunity to solve your technical challenges and work with your current stack.`,
      `Thank you for your time and consideration of my application. I look forward to discussing how my experience fits your team's ongoing project needs.`
    ],
    sign_off: "Best Regards,\nCandidate",
    full_letter: "Dear Hiring Team,\n\nI am writing to express my strong interest in joining your team. Based on my experience and technical backgrounds, I believe I can make immediate, high-quality contributions as a member of your company.\n\nIn my past work, I have focused on writing scalable systems and collaborating closely with design groups to build interfaces. Aligning my skills directly with your job description, I am excited about the opportunity to solve your technical challenges and work with your current stack.\n\nThank you for your time and consideration of my application. I look forward to discussing how my experience fits your team's ongoing project needs.\n\nBest Regards,\nCandidate"
  };
}

function getMockLinkedInOptimizer(resumeText, targetRole) {
  return {
    headlines: [
      `${targetRole} | Specialized in building scalable high-performance Web Apps | React & Node.js`,
      `${targetRole} | Focused on improving page speed, cloud deployments, and clean software architecture`,
      `Passionate ${targetRole} | Crafting modern user experiences & robust backend solutions`,
      `Engineering Career Accelerator | ${targetRole} | Resolving system bottlenecks with code`,
      `${targetRole} | Technical Problem Solver | Continuous Learner & Tech Contributor`
    ],
    about_summary: "I am a dedicated software developer focused on building applications that solve real-world problems. With experience spanning frontend interfaces and backend APIs, I enjoy structural clean code and collaborative system designs.\n\nOver the past years, I have successfully deployed products, resolved performance latency challenges, and integrated third-party platforms.\n\nKey Skills: JavaScript, React, Node.js, Express, SQL, Git, and Docker. Always eager to explore cloud scalability patterns and automated testing workflows.",
    profile_tips: [
      "Upload a professional, clean headshot with a neutral or solid background.",
      "Add a customized banner related to coding, systems, or design.",
      "Turn on 'Creator Mode' to showcase your specific topics and articles."
    ]
  };
}

function getMockSkillGapAnalysis(resumeText, targetRole, jobDescription) {
  return {
    match_percentage: 70,
    matching_skills: ["JavaScript", "React", "Node.js", "SQL", "Git"],
    missing_skills: [
      {
        skill: "Docker",
        priority: "Critical",
        learning_difficulty: "Medium",
        description: "Required for shipping local code configurations into consistent containerized environments."
      },
      {
        skill: "TypeScript",
        priority: "Preferred",
        learning_difficulty: "Medium",
        description: "Adds type safety to Javascript apps, which is standard in enterprise codebases."
      },
      {
        skill: "CI/CD Pipelines",
        priority: "Optional",
        learning_difficulty: "Hard",
        description: "Automates testing and deployments when pushing code changes to main branches."
      }
    ],
    bridging_recommendations: [
      "Create a sample docker image for your portfolio projects.",
      "Convert a simple React project into TypeScript to understand type interfaces.",
      "Configure a basic GitHub Actions workflow to run automatic linter tests on pull requests."
    ]
  };
}

function getMockLearningPlan(skillsToLearn, currentLevel) {
  return {
    plan_name: `Fast-track ${skillsToLearn} Course`,
    duration_weeks: 1,
    daily_tasks: [
      {
        day: 1,
        week: 1,
        topic: "Core Concept Introductions",
        estimated_minutes: 40,
        sub_tasks: [
          "Understand the core syntax and basic architectural structure",
          "Setup the local toolchain and hello-world execution scripts"
        ],
        resources: [
          "Official Beginner Handbook Tutorial"
        ],
        quiz: {
          question: "Which of the following describes the main benefit of this technology?",
          options: [
            "Consistent environment packaging and dependency isolation",
            "Accelerates general hardware speeds by 5x",
            "Translates code directly into native mobile binary formats",
            "Automatically updates security credentials for the developer"
          ],
          answer_index: 0,
          explanation: "Isolated containment packages all system libraries and code dependencies together, preventing local dependency conflicts."
        }
      },
      {
        day: 2,
        week: 1,
        topic: "Configuration and Basic API Hooks",
        estimated_minutes: 50,
        sub_tasks: [
          "Learn common configuration schemas and options",
          "Hook data states and inspect terminal output results"
        ],
        resources: [
          "Intermediate Developer Reference Guideline"
        ],
        quiz: {
          question: "How do you specify environmental parameters in a config profile?",
          options: [
            "Define keys in a secret file or bind them as system environment variables",
            "Write a script that compiles values during bootstrap startup operations",
            "Use inline hardcoded values inside the root library templates",
            "Request them from global runtime endpoints"
          ],
          answer_index: 0,
          explanation: "Binding options via system variables or .env files is standard security practice, preventing sensitive data exposure."
        }
      },
      {
        day: 3,
        week: 1,
        topic: "Connecting Databases and Storages",
        estimated_minutes: 60,
        sub_tasks: [
          "Create local schemas and databases",
          "Write query operations and retrieve records dynamically"
        ],
        resources: [
          "Database and Persistent Systems Guide"
        ],
        quiz: {
          question: "What is the primary benefit of indexing database fields?",
          options: [
            "Drastically speed up search and filter query performance",
            "Provides encryption safeguards to user profile data",
            "Shrinks overall disk memory allocation requirements",
            "Automates data format validation checks"
          ],
          answer_index: 0,
          explanation: "Indexes speed up data lookups by sorting specific fields, but they may increase write execution durations."
        }
      },
      {
        day: 4,
        week: 1,
        topic: "Basic Testing and Lint Checks",
        estimated_minutes: 45,
        sub_tasks: [
          "Write mock unit tests for validation features",
          "Run a code lint checker to ensure styling alignment"
        ],
        resources: [
          "Best Practices in Automated Testing handbook"
        ],
        quiz: {
          question: "What does code linting achieve?",
          options: [
            "Scans source code for potential style discrepancies and basic syntax warnings",
            "Compiles developer text files into efficient assembly codes",
            "Checks network connections and databases",
            "Encrypts files for delivery"
          ],
          answer_index: 0,
          explanation: "Linters review static code styling, bracket layouts, and variable references to maintain consistent team code formatting."
        }
      },
      {
        day: 5,
        week: 1,
        topic: "Build Optimization and Asset Bundling",
        estimated_minutes: 55,
        sub_tasks: [
          "Analyze build package bundles for sizes",
          "Remove redundant dependencies and set runtime flags"
        ],
        resources: [
          "Vite and Webpack Bundle Optimization strategies"
        ],
        quiz: {
          question: "What is tree shaking in compilation processes?",
          options: [
            "The automatic removal of unused source code from bundles during packaging",
            "Running multi-threaded tasks on multiple processors",
            "A structural testing paradigm involving randomly simulated inputs",
            "Storing local page state elements inside browser memory blocks"
          ],
          answer_index: 0,
          explanation: "Tree shaking strips out dead imports that are never executed in the codebase, saving bundle sizes for web transfers."
        }
      },
      {
        day: 6,
        week: 1,
        topic: "Basic Deployment and Routing Setup",
        estimated_minutes: 50,
        sub_tasks: [
          "Expose internal endpoints through API route layers",
          "Deploy static assets to cloud providers (e.g. Netlify, Vercel)"
        ],
        resources: [
          "Deploying and Routing Modern Web Apps guide"
        ],
        quiz: {
          question: "Which response code indicates a redirect action from servers?",
          options: [
            "302 Found",
            "404 Not Found",
            "200 OK",
            "500 Internal Error"
          ],
          answer_index: 0,
          explanation: "3xx HTTP response status codes signify redirection redirections to secondary URLs."
        }
      },
      {
        day: 7,
        week: 1,
        topic: "Final Review & Portfolio Integration",
        estimated_minutes: 60,
        sub_tasks: [
          "Merge changes into main branch structures",
          "Publish a demo URL to show recruiters the live project"
        ],
        resources: [
          "Writing clear documentation readmes"
        ],
        quiz: {
          question: "Where should candidate repository links be highlighted?",
          options: [
            "On the top banner section of LinkedIn and the resume header line",
            "Inside secondary hidden profile files",
            "In local folders only",
            "Shared only when asked during formal background checks"
          ],
          answer_index: 0,
          explanation: "Prominently showcasing code repositories makes it incredibly easy for technical recruiters to assess code craftsmanship."
        }
      }
    ]
  };
}

function getMockInterviewQuestions(role, type) {
  return {
    role,
    type,
    questions: [
      {
        id: 1,
        question: `Tell me about a challenging project you built as a ${role}. What technical hurdles did you face, and how did you resolve them?`,
        intent: "Assess problem-solving capabilities, communication clarity, and candidate's specific technical ownership.",
        difficulty: "Medium"
      },
      {
        id: 2,
        question: `How do you approach learning a new framework or technology when starting a task?`,
        intent: "Evaluates continuous learning speed, self-reliance, and architectural research methods.",
        difficulty: "Easy"
      },
      {
        id: 3,
        question: `Describe a scenario where you had a strong technical disagreement with a team member. How did you handle it?`,
        intent: "Measures emotional intelligence, collaboration capabilities, and professional conflict resolution style.",
        difficulty: "Medium"
      },
      {
        id: 4,
        question: `What are your favorite optimization techniques to make database and network calls run fast?`,
        intent: "Tests performance knowledge (caching, query optimization, indexing, and resource pools).",
        difficulty: "Hard"
      },
      {
        id: 5,
        question: `Why do you want to join our organization, and where do you see your career heading in the next 3 years?`,
        intent: "Verifies organizational alignment, cultural fit, and long-term career ambition trajectories.",
        difficulty: "Easy"
      }
    ]
  };
}

function getMockInterviewEvaluation(question, userResponse) {
  return {
    score: 75,
    feedback_summary: "The answer shows good experience but lacks structure and quantifiable outcomes. Applying the STAR method (Situation, Task, Action, Result) will make it much stronger.",
    strengths: [
      "Demonstrates clear experience working with teams.",
      "Honest depiction of technical challenges faced."
    ],
    weaknesses: [
      "Vague about the exact role they played in the solution.",
      "Did not mention the final business or performance outcome metric of the fix."
    ],
    revised_better_version: "In my last role, we had a server slowdown (Situation). I was assigned to speed up the slow database queries (Task). I indexed the core user tables and optimized 12 raw SQL queries (Action). As a result, database response latency decreased by 40%, and overall page load times improved by 1.2 seconds (Result).",
    rating: "Pass"
  };
}

function getMockCodingQuestions(topic, difficulty) {
  return {
    title: "Two Sum Target Summation",
    topic,
    difficulty,
    problem_statement: "Given an array of integers 'nums' and an integer 'target', return indices of the two numbers such that they add up to the target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 2 + 7 == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "nums[1] + nums[2] == 2 + 4 == 6, we return [1, 2]."
      }
    ],
    starter_code: {
      javascript: "function twoSum(nums, target) {\n  // Write your code here\n  return [];\n}",
      python: "def two_sum(nums, target):\n    # Write your code here\n    return []",
      cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};"
    }
  };
}

function getMockCodeEvaluation(problemTitle, code, language) {
  const containsMap = code.includes('Map') || code.includes('dict') || code.includes('unordered_map');
  const score = containsMap ? 95 : 70;
  
  return {
    is_correct: true,
    time_complexity: containsMap ? "O(N)" : "O(N^2)",
    space_complexity: containsMap ? "O(N)" : "O(1)",
    issues_found: containsMap 
      ? ["Excellent usage of a hash map to look up complements in linear time."]
      : ["Using nested loops runs in O(N^2) time. While functional, it is inefficient for large datasets. You should use a Hash Map/Dictionary to store seen elements."],
    review: containsMap 
      ? "Great job! This is the optimal solution. Code is clean, well-formatted, and operates in linear runtime complexity." 
      : "The logic is correct, but optimization is possible. The nested loops result in a quadratic time complexity. Storing elements in a hash map solves this in a single scan.",
    optimized_code: language === 'python' 
      ? "def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []"
      : "function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (seen.has(complement)) {\n      return [seen.get(complement), i];\n    }\n    seen.set(nums[i], i);\n  }\n  return [];\n}",
    score
  };
}

function getMockSalaryInsights(role, location) {
  return {
    role,
    location,
    currency: "USD",
    ranges: {
      entry: { min: 65000, median: 80000, max: 95000 },
      mid: { min: 95000, median: 120000, max: 145000 },
      senior: { min: 140000, median: 175000, max: 220000 }
    },
    benefits: [
      "Health, Vision, and Dental Insurance",
      "401(k) Matching (up to 4-5%)",
      "Flexible PTO & Remote Work allowances",
      "Learning & Development budget ($1000 - $2000 annually)"
    ],
    market_demand: "High",
    negotiation_tips: [
      "Research salary standard indicators for this region prior to sharing constraints.",
      "Prepare 3 concrete examples of how your previous code improvements saved load times or resources.",
      "Negotiate for sign-on bonuses or extra stock awards if base salary limits are firm."
    ]
  };
}
