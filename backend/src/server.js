import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

import {
  initDatabase,
  dbRun,
  dbGet,
  dbAll
} from './database.js';

import {
  generateRoadmap,
  analyzeResume,
  generateCoverLetter,
  generateLinkedInOptimizer,
  analyzeSkillGap,
  generateLearningPlan,
  startMockInterview,
  evaluateInterviewResponse,
  getCodingQuestions,
  evaluateCodeSubmission,
  getSalaryInsights,
  getChatAssistantResponse
} from './services/geminiService.js';

import { authMiddleware } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ai_career_coach_jwt_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for in-memory file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Initialize database when server starts
initDatabase();

/* ==========================================================================
   1. AUTHENTICATION ENDPOINTS
   ========================================================================== */

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, target_role, experience_level } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Please provide email, password, and full name.' });
  }

  try {
    const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await dbRun(
      `INSERT INTO users (email, password_hash, full_name, target_role, experience_level) 
       VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, full_name, target_role || '', experience_level || 'Beginner']
    );

    // Auto-login after registration
    const token = jwt.sign(
      { id: result.id, email, full_name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: { id: result.id, email, full_name, target_role, experience_level }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        target_role: user.target_role,
        experience_level: user.experience_level
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Update Profile
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const { target_role, experience_level, full_name } = req.body;
  const userId = req.user.id;

  try {
    await dbRun(
      `UPDATE users 
       SET full_name = COALESCE(?, full_name), 
           target_role = COALESCE(?, target_role), 
           experience_level = COALESCE(?, experience_level) 
       WHERE id = ?`,
      [full_name, target_role, experience_level, userId]
    );

    const updatedUser = await dbGet(
      'SELECT id, email, full_name, target_role, experience_level FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

/* ==========================================================================
   2. ROADMAP GENERATION
   ========================================================================== */
app.post('/api/roadmap', authMiddleware, async (req, res) => {
  const { role, level, timeline } = req.body;
  const userId = req.user.id;

  if (!role || !level || !timeline) {
    return res.status(400).json({ error: 'Please provide role, level, and timeline.' });
  }

  try {
    const roadmapData = await generateRoadmap(role, level, timeline);

    // Save generated roadmap to history
    await dbRun(
      `INSERT INTO roadmaps (user_id, role, level, roadmap_json) VALUES (?, ?, ?, ?)`,
      [userId, role, level, JSON.stringify(roadmapData)]
    );

    res.json(roadmapData);
  } catch (error) {
    console.error('Error generating roadmap:', error);
    res.status(500).json({ error: error.message || 'Failed to generate roadmap.' });
  }
});

app.get('/api/roadmap/history', authMiddleware, async (req, res) => {
  try {
    const roadmaps = await dbAll(
      'SELECT * FROM roadmaps WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(roadmaps.map(r => ({
      id: r.id,
      role: r.role,
      level: r.level,
      created_at: r.created_at,
      roadmap: JSON.parse(r.roadmap_json)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve roadmap history.' });
  }
});

/* ==========================================================================
   3. RESUME UPLOAD & ANALYSIS
   ========================================================================== */
app.post('/api/resume/analyze', authMiddleware, upload.single('resume'), async (req, res) => {
  const userId = req.user.id;
  const targetRole = req.body.targetRole;

  if (!req.file && !req.body.resumeText) {
    return res.status(400).json({ error: 'Please upload a PDF file or provide resume text.' });
  }

  try {
    let resumeText = '';

    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const parsed = await pdfParse(req.file.buffer);
        resumeText = parsed.text;
      } else {
        // Fallback reading as buffer text (for txt files)
        resumeText = req.file.buffer.toString('utf-8');
      }
    } else {
      resumeText = req.body.resumeText;
    }

    if (!resumeText.trim()) {
      return res.status(400).json({ error: 'Could not extract text from the resume.' });
    }

    const analysis = await analyzeResume(resumeText, targetRole);

    // Save in Database
    await dbRun(
      `INSERT INTO resumes (user_id, file_name, parsed_text, analysis_json) 
       VALUES (?, ?, ?, ?)`,
      [userId, req.file ? req.file.originalname : 'raw_text_entry.txt', resumeText, JSON.stringify(analysis)]
    );

    res.json({
      filename: req.file ? req.file.originalname : 'Text Entry',
      analysis
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze resume.' });
  }
});

app.get('/api/resume/history', authMiddleware, async (req, res) => {
  try {
    const resumes = await dbAll(
      'SELECT id, file_name, analysis_json, created_at FROM resumes WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(resumes.map(r => ({
      id: r.id,
      file_name: r.file_name,
      created_at: r.created_at,
      analysis: JSON.parse(r.analysis_json)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve resume history.' });
  }
});

/* ==========================================================================
   4. COVER LETTER & LINKEDIN GENERATOR
   ========================================================================== */
app.post('/api/cover-letter', authMiddleware, async (req, res) => {
  const { resumeText, jobDescription, tone } = req.body;
  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: 'Please provide resume details and a job description.' });
  }

  try {
    const letter = await generateCoverLetter(resumeText, jobDescription, tone);
    res.json(letter);
  } catch (error) {
    console.error('Cover letter error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate cover letter.' });
  }
});

app.post('/api/linkedin', authMiddleware, async (req, res) => {
  const { resumeText, targetRole } = req.body;
  if (!resumeText || !targetRole) {
    return res.status(400).json({ error: 'Please provide resume details and target role.' });
  }

  try {
    const optimized = await generateLinkedInOptimizer(resumeText, targetRole);
    res.json(optimized);
  } catch (error) {
    console.error('LinkedIn optimization error:', error);
    res.status(500).json({ error: error.message || 'Failed to optimize LinkedIn profile.' });
  }
});

/* ==========================================================================
   5. SKILL GAP & LEARNING PLAN
   ========================================================================== */
app.post('/api/skill-gap', authMiddleware, async (req, res) => {
  const { resumeText, targetRole, jobDescription } = req.body;
  if (!resumeText || !targetRole || !jobDescription) {
    return res.status(400).json({ error: 'Please provide resume details, target role, and job description.' });
  }

  try {
    const gapAnalysis = await analyzeSkillGap(resumeText, targetRole, jobDescription);
    res.json(gapAnalysis);
  } catch (error) {
    console.error('Skill gap error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze skill gaps.' });
  }
});

app.post('/api/learning-plan', authMiddleware, async (req, res) => {
  const { skillsToLearn, currentLevel } = req.body;
  const userId = req.user.id;

  if (!skillsToLearn) {
    return res.status(400).json({ error: 'Please provide the skills or gap areas to target.' });
  }

  try {
    const learningPlan = await generateLearningPlan(skillsToLearn, currentLevel || 'Beginner');

    // Save learning plan to Database
    await dbRun(
      'INSERT INTO learning_plans (user_id, plan_json, completed_tasks) VALUES (?, ?, ?)',
      [userId, JSON.stringify(learningPlan), '[]']
    );

    res.json({
      plan: learningPlan,
      completed_tasks: []
    });
  } catch (error) {
    console.error('Learning plan error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate learning plan.' });
  }
});

app.get('/api/learning-plan/active', authMiddleware, async (req, res) => {
  try {
    const activePlan = await dbGet(
      'SELECT id, plan_json, completed_tasks, created_at FROM learning_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    if (!activePlan) {
      return res.json(null);
    }
    res.json({
      id: activePlan.id,
      plan: JSON.parse(activePlan.plan_json),
      completed_tasks: JSON.parse(activePlan.completed_tasks),
      created_at: activePlan.created_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve active learning plan.' });
  }
});

app.post('/api/learning-plan/toggle-task', authMiddleware, async (req, res) => {
  const { planId, dayIndex } = req.body; // Toggle day complete
  if (planId === undefined || dayIndex === undefined) {
    return res.status(400).json({ error: 'Please provide planId and dayIndex.' });
  }

  try {
    const activePlan = await dbGet(
      'SELECT completed_tasks FROM learning_plans WHERE id = ? AND user_id = ?',
      [planId, req.user.id]
    );

    if (!activePlan) {
      return res.status(404).json({ error: 'Learning plan not found.' });
    }

    let completed = JSON.parse(activePlan.completed_tasks || '[]');
    if (completed.includes(dayIndex)) {
      completed = completed.filter(d => d !== dayIndex);
    } else {
      completed.push(dayIndex);
    }

    await dbRun(
      'UPDATE learning_plans SET completed_tasks = ? WHERE id = ?',
      [JSON.stringify(completed), planId]
    );

    res.json({ success: true, completed_tasks: completed });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update learning progress.' });
  }
});

/* ==========================================================================
   6. MOCK INTERVIEW
   ========================================================================== */
app.post('/api/interview/start', authMiddleware, async (req, res) => {
  const { role, type } = req.body;
  if (!role) {
    return res.status(400).json({ error: 'Please provide target role for the interview.' });
  }

  try {
    const interviewSetup = await startMockInterview(role, type || 'Technical');
    res.json(interviewSetup);
  } catch (error) {
    console.error('Interview start error:', error);
    res.status(500).json({ error: error.message || 'Failed to start interview.' });
  }
});

app.post('/api/interview/evaluate', authMiddleware, async (req, res) => {
  const { question, response } = req.body;
  if (!question || !response) {
    return res.status(400).json({ error: 'Please provide both question and response.' });
  }

  try {
    const evaluation = await evaluateInterviewResponse(question, response);
    res.json(evaluation);
  } catch (error) {
    console.error('Interview evaluation error:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate answer.' });
  }
});

app.post('/api/interview/save', authMiddleware, async (req, res) => {
  const { role, dialogue, score, feedback } = req.body;
  const userId = req.user.id;

  if (!role || !dialogue) {
    return res.status(400).json({ error: 'Please provide interview role and dialogue history.' });
  }

  try {
    await dbRun(
      `INSERT INTO interviews (user_id, role, dialogue_json, score, feedback) VALUES (?, ?, ?, ?, ?)`,
      [userId, role, JSON.stringify(dialogue), score, feedback]
    );
    res.json({ success: true, message: 'Interview feedback saved successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save interview result.' });
  }
});

app.get('/api/interview/history', authMiddleware, async (req, res) => {
  try {
    const list = await dbAll(
      'SELECT id, role, score, feedback, created_at FROM interviews WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load interview history.' });
  }
});

/* ==========================================================================
   7. CODING CHALLENGES
   ========================================================================== */
app.post('/api/coding/question', authMiddleware, async (req, res) => {
  const { topic, difficulty } = req.body;
  try {
    const question = await getCodingQuestions(topic || 'Algorithms', difficulty || 'Medium');
    res.json(question);
  } catch (error) {
    console.error('Coding questions error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch coding challenge.' });
  }
});

app.post('/api/coding/submit', authMiddleware, async (req, res) => {
  const { problemTitle, code, language } = req.body;
  if (!problemTitle || !code || !language) {
    return res.status(400).json({ error: 'Please provide problemTitle, code, and language.' });
  }

  try {
    const evaluation = await evaluateCodeSubmission(problemTitle, code, language);
    res.json(evaluation);
  } catch (error) {
    console.error('Coding compilation error:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate code.' });
  }
});

/* ==========================================================================
   8. SALARY INSIGHTS
   ========================================================================== */
app.post('/api/salaries', authMiddleware, async (req, res) => {
  const { role, location } = req.body;
  const userId = req.user.id;
  if (!role) {
    return res.status(400).json({ error: 'Please specify a job role.' });
  }

  try {
    const salaryData = await getSalaryInsights(role, location || 'United States');

    // Save search history
    await dbRun(
      'INSERT INTO saved_salaries (user_id, role, location, salary_json) VALUES (?, ?, ?, ?)',
      [userId, role, location || 'United States', JSON.stringify(salaryData)]
    );

    res.json(salaryData);
  } catch (error) {
    console.error('Salary insights error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch compensation data.' });
  }
});

app.get('/api/salaries/saved', authMiddleware, async (req, res) => {
  try {
    const saved = await dbAll(
      'SELECT id, role, location, salary_json, created_at FROM saved_salaries WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    );
    res.json(saved.map(s => ({
      id: s.id,
      role: s.role,
      location: s.location,
      created_at: s.created_at,
      data: JSON.parse(s.salary_json)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve saved salaries.' });
  }
});

/* ==========================================================================
   9. AI ADVISOR CHAT ASSISTANT
   ========================================================================== */
app.get('/api/chats', authMiddleware, async (req, res) => {
  try {
    const history = await dbAll(
      'SELECT id, message, sender, created_at FROM chats WHERE user_id = ? ORDER BY created_at ASC',
      [req.user.id]
    );
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve chat history.' });
  }
});

app.post('/api/chats', authMiddleware, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message) {
    return res.status(400).json({ error: 'Message content cannot be blank.' });
  }

  try {
    // 1. Get recent chat history to pass as context
    const history = await dbAll(
      'SELECT message, sender FROM chats WHERE user_id = ? ORDER BY created_at ASC LIMIT 10',
      [userId]
    );

    // 2. Fetch user profile
    const profile = await dbGet(
      'SELECT target_role, experience_level FROM users WHERE id = ?',
      [userId]
    );

    // 3. Save user message to database
    await dbRun(
      'INSERT INTO chats (user_id, message, sender) VALUES (?, ?, ?)',
      [userId, message, 'user']
    );

    // 4. Generate AI feedback from Gemini API
    const aiResponse = await getChatAssistantResponse(history, message, profile);

    // 5. Save AI response to database
    await dbRun(
      'INSERT INTO chats (user_id, message, sender) VALUES (?, ?, ?)',
      [userId, aiResponse, 'ai']
    );

    res.json({
      userMessage: message,
      aiMessage: aiResponse
    });
  } catch (error) {
    console.error('Advisor chat error:', error);
    res.status(500).json({ error: error.message || 'AI coach could not answer at this moment.' });
  }
});

/* ==========================================================================
   10. USER DASHBOARD SUMMARY DATA
   ========================================================================== */
app.get('/api/dashboard/summary', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // Latest Resume Score
    const latestResume = await dbGet(
      'SELECT analysis_json FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    const resumeScore = latestResume ? JSON.parse(latestResume.analysis_json).score : null;

    // Active Roadmap Progress (simple check if user has created one)
    const latestRoadmap = await dbGet(
      'SELECT role, level FROM roadmaps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    // Completed daily tasks counts
    const activeLearningPlan = await dbGet(
      'SELECT plan_json, completed_tasks FROM learning_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    let learningProgress = null;
    if (activeLearningPlan) {
      const plan = JSON.parse(activeLearningPlan.plan_json);
      const completed = JSON.parse(activeLearningPlan.completed_tasks || '[]');
      const learningTasksCount = plan.daily_tasks ? plan.daily_tasks.length : 0;
      const completedTasksCount = completed.length;
      learningProgress = {
        total: learningTasksCount,
        completed: completedTasksCount,
        percentage: learningTasksCount > 0 ? Math.round((completedTasksCount / learningTasksCount) * 100) : 0
      };
    }

    // Number of mock interviews completed
    const interviewCountRow = await dbGet(
      'SELECT COUNT(*) as cnt FROM interviews WHERE user_id = ?',
      [userId]
    );
    const interviewCount = interviewCountRow ? interviewCountRow.cnt : 0;

    // Latest interview score
    const latestInterview = await dbGet(
      'SELECT score, role FROM interviews WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    res.json({
      resumeScore,
      activeRoadmap: latestRoadmap ? { role: latestRoadmap.role, level: latestRoadmap.level } : null,
      learningProgress,
      interviewCount,
      latestInterview: latestInterview ? { score: latestInterview.score, role: latestInterview.role } : null
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard summaries.' });
  }
});

// Root path heartbeat
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
