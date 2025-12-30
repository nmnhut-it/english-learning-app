/**
 * Vocabulary Game Server
 * - Quản lý lớp học và học sinh
 * - Lưu kết quả thi đấu
 * - Theo dõi từ vựng đã học/sai
 * - Tính năng ôn tập từ vựng cũ (spaced repetition)
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3007;

// Middleware
app.use(cors());
app.use(express.json());

// Data directories
const DATA_DIR = path.join(__dirname, 'data');
const CLASSES_DIR = path.join(DATA_DIR, 'classes');
const RESULTS_DIR = path.join(DATA_DIR, 'results');
const REVIEWS_DIR = path.join(DATA_DIR, 'reviews');

// Ensure directories exist
[DATA_DIR, CLASSES_DIR, RESULTS_DIR, REVIEWS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper functions
function readJsonFile(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading file:', filePath, err);
  }
  return defaultValue;
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ============================================
// API: Health check
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'vocab-game-server' });
});

// ============================================
// API: Class Management
// ============================================

// Get all classes
app.get('/api/classes', (req, res) => {
  try {
    const files = fs.readdirSync(CLASSES_DIR).filter(f => f.endsWith('.json'));
    const classes = files.map(f => {
      const data = readJsonFile(path.join(CLASSES_DIR, f));
      return {
        id: f.replace('.json', ''),
        ...data
      };
    });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single class
app.get('/api/classes/:classId', (req, res) => {
  try {
    const filePath = path.join(CLASSES_DIR, `${req.params.classId}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Class not found' });
    }
    const data = readJsonFile(filePath);
    res.json({ id: req.params.classId, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Update class
app.post('/api/classes/:classId', (req, res) => {
  try {
    const { students, grade } = req.body;
    const classId = req.params.classId;
    const filePath = path.join(CLASSES_DIR, `${classId}.json`);

    const existingData = readJsonFile(filePath, {
      students: [],
      grade: null,
      createdAt: new Date().toISOString()
    });

    const data = {
      ...existingData,
      students: students || existingData.students,
      grade: grade || existingData.grade,
      updatedAt: new Date().toISOString()
    };

    writeJsonFile(filePath, data);
    res.json({ id: classId, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete class
app.delete('/api/classes/:classId', (req, res) => {
  try {
    const filePath = path.join(CLASSES_DIR, `${req.params.classId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: Battle Results
// ============================================

// Save battle result
app.post('/api/results', (req, res) => {
  try {
    const { classId, lessonId, players, mode, timestamp } = req.body;

    if (!classId || !players) {
      return res.status(400).json({ error: 'Missing classId or players' });
    }

    // Create result file name: classId_timestamp.json
    const resultId = `${classId}_${Date.now()}`;
    const filePath = path.join(RESULTS_DIR, `${resultId}.json`);

    const data = {
      classId,
      lessonId: lessonId || 'unknown',
      mode: mode || 'classroom_battle',
      players,
      timestamp: timestamp || new Date().toISOString()
    };

    writeJsonFile(filePath, data);

    // Update student vocabulary tracking
    updateVocabularyTracking(classId, players);

    res.json({ id: resultId, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get results for a class
app.get('/api/results/:classId', (req, res) => {
  try {
    const files = fs.readdirSync(RESULTS_DIR)
      .filter(f => f.startsWith(req.params.classId + '_') && f.endsWith('.json'));

    const results = files.map(f => {
      const data = readJsonFile(path.join(RESULTS_DIR, f));
      return {
        id: f.replace('.json', ''),
        ...data
      };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: Vocabulary Tracking & Review
// ============================================

// Update vocabulary tracking based on battle results
function updateVocabularyTracking(classId, players) {
  const trackingFile = path.join(REVIEWS_DIR, `${classId}_tracking.json`);
  const tracking = readJsonFile(trackingFile, { students: {} });

  players.forEach(player => {
    if (!tracking.students[player.name]) {
      tracking.students[player.name] = {
        words: {},
        totalCorrect: 0,
        totalWrong: 0
      };
    }

    const studentData = tracking.students[player.name];

    // Update word-level tracking
    if (player.wordHistory) {
      player.wordHistory.forEach(item => {
        const wordKey = item.word;
        if (!studentData.words[wordKey]) {
          studentData.words[wordKey] = {
            correct: 0,
            wrong: 0,
            lastSeen: null,
            nextReview: null,
            level: 0 // Spaced repetition level
          };
        }

        const wordData = studentData.words[wordKey];
        if (item.correct) {
          wordData.correct++;
          studentData.totalCorrect++;
          // Increase spaced repetition level (max 5)
          wordData.level = Math.min(5, wordData.level + 1);
        } else {
          wordData.wrong++;
          studentData.totalWrong++;
          // Reset spaced repetition level
          wordData.level = 0;
        }

        wordData.lastSeen = new Date().toISOString();
        // Calculate next review based on level
        // Level 0: 1 day, Level 1: 2 days, Level 2: 4 days, etc.
        const daysUntilReview = Math.pow(2, wordData.level);
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + daysUntilReview);
        wordData.nextReview = nextReview.toISOString();
      });
    }

    // Update overall stats
    studentData.lastActive = new Date().toISOString();
  });

  writeJsonFile(trackingFile, tracking);
}

// Get vocabulary tracking for a class
app.get('/api/tracking/:classId', (req, res) => {
  try {
    const trackingFile = path.join(REVIEWS_DIR, `${req.params.classId}_tracking.json`);
    const tracking = readJsonFile(trackingFile, { students: {} });
    res.json(tracking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get words due for review for a student
app.get('/api/review/:classId/:studentName', (req, res) => {
  try {
    const { classId, studentName } = req.params;
    const trackingFile = path.join(REVIEWS_DIR, `${classId}_tracking.json`);
    const tracking = readJsonFile(trackingFile, { students: {} });

    if (!tracking.students[studentName]) {
      return res.json({ dueWords: [], stats: null });
    }

    const studentData = tracking.students[studentName];
    const now = new Date();

    // Find words due for review
    const dueWords = Object.entries(studentData.words)
      .filter(([word, data]) => {
        if (!data.nextReview) return true;
        return new Date(data.nextReview) <= now;
      })
      .map(([word, data]) => ({
        word,
        ...data,
        priority: data.wrong > data.correct ? 'high' : 'normal'
      }))
      .sort((a, b) => {
        // Prioritize words with more errors
        const aScore = a.wrong - a.correct;
        const bScore = b.wrong - b.correct;
        return bScore - aScore;
      });

    res.json({
      dueWords,
      stats: {
        totalWords: Object.keys(studentData.words).length,
        totalCorrect: studentData.totalCorrect,
        totalWrong: studentData.totalWrong,
        accuracy: studentData.totalCorrect + studentData.totalWrong > 0
          ? Math.round(studentData.totalCorrect / (studentData.totalCorrect + studentData.totalWrong) * 100)
          : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get class-wide vocabulary stats (for teacher dashboard)
app.get('/api/stats/:classId', (req, res) => {
  try {
    const { classId } = req.params;
    const trackingFile = path.join(REVIEWS_DIR, `${classId}_tracking.json`);
    const tracking = readJsonFile(trackingFile, { students: {} });

    // Aggregate word difficulty across all students
    const wordStats = {};
    const studentStats = [];

    Object.entries(tracking.students).forEach(([studentName, studentData]) => {
      studentStats.push({
        name: studentName,
        totalWords: Object.keys(studentData.words).length,
        totalCorrect: studentData.totalCorrect,
        totalWrong: studentData.totalWrong,
        accuracy: studentData.totalCorrect + studentData.totalWrong > 0
          ? Math.round(studentData.totalCorrect / (studentData.totalCorrect + studentData.totalWrong) * 100)
          : 0,
        lastActive: studentData.lastActive
      });

      Object.entries(studentData.words).forEach(([word, data]) => {
        if (!wordStats[word]) {
          wordStats[word] = { correct: 0, wrong: 0, students: 0 };
        }
        wordStats[word].correct += data.correct;
        wordStats[word].wrong += data.wrong;
        wordStats[word].students++;
      });
    });

    // Find difficult words (high error rate)
    const difficultWords = Object.entries(wordStats)
      .map(([word, data]) => ({
        word,
        ...data,
        errorRate: data.correct + data.wrong > 0
          ? Math.round(data.wrong / (data.correct + data.wrong) * 100)
          : 0
      }))
      .filter(w => w.wrong > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 20);

    res.json({
      classId,
      totalStudents: Object.keys(tracking.students).length,
      studentStats: studentStats.sort((a, b) => b.accuracy - a.accuracy),
      difficultWords,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate review quiz for a class (problematic words)
app.get('/api/review-quiz/:classId', (req, res) => {
  try {
    const { classId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const trackingFile = path.join(REVIEWS_DIR, `${classId}_tracking.json`);
    const tracking = readJsonFile(trackingFile, { students: {} });

    // Aggregate word errors
    const wordErrors = {};

    Object.values(tracking.students).forEach(studentData => {
      Object.entries(studentData.words).forEach(([word, data]) => {
        if (!wordErrors[word]) {
          wordErrors[word] = { correct: 0, wrong: 0 };
        }
        wordErrors[word].correct += data.correct;
        wordErrors[word].wrong += data.wrong;
      });
    });

    // Get words with highest error rates
    const reviewWords = Object.entries(wordErrors)
      .filter(([word, data]) => data.wrong > 0)
      .map(([word, data]) => ({
        word,
        errorRate: data.wrong / (data.correct + data.wrong),
        totalAttempts: data.correct + data.wrong
      }))
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit)
      .map(w => w.word);

    res.json({
      classId,
      reviewWords,
      totalProblematicWords: Object.keys(wordErrors).filter(w => wordErrors[w].wrong > 0).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: Leaderboard (Points & Rankings)
// ============================================

const LEADERBOARD_DIR = path.join(DATA_DIR, 'leaderboards');
if (!fs.existsSync(LEADERBOARD_DIR)) {
  fs.mkdirSync(LEADERBOARD_DIR, { recursive: true });
}

// Get leaderboard for a class
app.get('/api/leaderboard/:classId', (req, res) => {
  try {
    const { classId } = req.params;
    const filePath = path.join(LEADERBOARD_DIR, `${classId}.json`);
    const data = readJsonFile(filePath, {
      classId,
      students: {},
      sessions: [],
      currentSession: null,
      createdAt: new Date().toISOString()
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update student points
app.post('/api/leaderboard/:classId/points', (req, res) => {
  try {
    const { classId } = req.params;
    const { studentName, points, reason } = req.body;

    if (!studentName || points === undefined) {
      return res.status(400).json({ error: 'Missing studentName or points' });
    }

    const filePath = path.join(LEADERBOARD_DIR, `${classId}.json`);
    const data = readJsonFile(filePath, {
      classId,
      students: {},
      sessions: [],
      currentSession: null,
      createdAt: new Date().toISOString()
    });

    // Initialize student if not exists
    if (!data.students[studentName]) {
      data.students[studentName] = {
        totalPoints: 0,
        sessionPoints: 0,
        history: []
      };
    }

    const student = data.students[studentName];
    const pointChange = parseInt(points);

    // Add to history
    student.history.push({
      points: pointChange,
      reason: reason || 'Manual adjustment',
      timestamp: new Date().toISOString(),
      session: data.currentSession
    });

    // Update totals
    student.totalPoints += pointChange;
    student.sessionPoints += pointChange;

    data.updatedAt = new Date().toISOString();
    writeJsonFile(filePath, data);

    res.json({
      studentName,
      newTotal: student.totalPoints,
      sessionPoints: student.sessionPoints,
      change: pointChange
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start new session
app.post('/api/leaderboard/:classId/session', (req, res) => {
  try {
    const { classId } = req.params;
    const { sessionName, resetPoints } = req.body;

    const filePath = path.join(LEADERBOARD_DIR, `${classId}.json`);
    const data = readJsonFile(filePath, {
      classId,
      students: {},
      sessions: [],
      currentSession: null,
      createdAt: new Date().toISOString()
    });

    // Save current session if exists
    if (data.currentSession) {
      data.sessions.push({
        name: data.currentSession,
        endedAt: new Date().toISOString(),
        rankings: Object.entries(data.students)
          .map(([name, s]) => ({ name, points: s.sessionPoints }))
          .sort((a, b) => b.points - a.points)
      });
    }

    // Start new session
    data.currentSession = sessionName || `Session ${data.sessions.length + 1}`;

    // Reset session points (optionally reset total too)
    Object.values(data.students).forEach(student => {
      student.sessionPoints = 0;
      if (resetPoints) {
        student.totalPoints = 0;
        student.history = [];
      }
    });

    data.updatedAt = new Date().toISOString();
    writeJsonFile(filePath, data);

    res.json({
      currentSession: data.currentSession,
      previousSessions: data.sessions.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add students to leaderboard
app.post('/api/leaderboard/:classId/students', (req, res) => {
  try {
    const { classId } = req.params;
    const { students } = req.body;

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ error: 'Missing students array' });
    }

    const filePath = path.join(LEADERBOARD_DIR, `${classId}.json`);
    const data = readJsonFile(filePath, {
      classId,
      students: {},
      sessions: [],
      currentSession: null,
      createdAt: new Date().toISOString()
    });

    students.forEach(name => {
      if (!data.students[name]) {
        data.students[name] = {
          totalPoints: 0,
          sessionPoints: 0,
          history: []
        };
      }
    });

    data.updatedAt = new Date().toISOString();
    writeJsonFile(filePath, data);

    res.json({
      totalStudents: Object.keys(data.students).length,
      added: students.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lucky wheel spin result
app.post('/api/leaderboard/:classId/spin', (req, res) => {
  try {
    const { classId } = req.params;
    const { studentName, prize } = req.body;

    if (!studentName || !prize) {
      return res.status(400).json({ error: 'Missing studentName or prize' });
    }

    const filePath = path.join(LEADERBOARD_DIR, `${classId}.json`);
    const data = readJsonFile(filePath, {
      classId,
      students: {},
      sessions: [],
      currentSession: null,
      createdAt: new Date().toISOString()
    });

    if (!data.students[studentName]) {
      data.students[studentName] = {
        totalPoints: 0,
        sessionPoints: 0,
        history: []
      };
    }

    const student = data.students[studentName];

    // Add spin to history
    student.history.push({
      points: prize.points,
      reason: `🎡 Lucky Wheel: ${prize.label}`,
      timestamp: new Date().toISOString(),
      session: data.currentSession,
      type: 'spin'
    });

    student.totalPoints += prize.points;
    student.sessionPoints += prize.points;

    data.updatedAt = new Date().toISOString();
    writeJsonFile(filePath, data);

    res.json({
      studentName,
      prize,
      newTotal: student.totalPoints,
      sessionPoints: student.sessionPoints
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API: Teacher Dashboard Summary
// ============================================

// Get all classes with summary stats
app.get('/api/dashboard', (req, res) => {
  try {
    const classFiles = fs.readdirSync(CLASSES_DIR).filter(f => f.endsWith('.json'));

    const dashboard = classFiles.map(f => {
      const classId = f.replace('.json', '');
      const classData = readJsonFile(path.join(CLASSES_DIR, f));
      const trackingFile = path.join(REVIEWS_DIR, `${classId}_tracking.json`);
      const tracking = readJsonFile(trackingFile, { students: {} });

      // Count recent activity (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      let recentBattles = 0;
      const resultFiles = fs.readdirSync(RESULTS_DIR)
        .filter(r => r.startsWith(classId + '_') && r.endsWith('.json'));

      resultFiles.forEach(r => {
        const result = readJsonFile(path.join(RESULTS_DIR, r));
        if (result.timestamp && new Date(result.timestamp) > weekAgo) {
          recentBattles++;
        }
      });

      return {
        id: classId,
        grade: classData.grade,
        studentCount: classData.students?.length || 0,
        trackedStudents: Object.keys(tracking.students).length,
        recentBattles,
        updatedAt: classData.updatedAt
      };
    });

    res.json({
      classes: dashboard.sort((a, b) => {
        // Sort by grade, then by class name
        if (a.grade !== b.grade) return (a.grade || 0) - (b.grade || 0);
        return a.id.localeCompare(b.id);
      }),
      totalClasses: dashboard.length,
      totalStudents: dashboard.reduce((sum, c) => sum + c.studentCount, 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log(' 📚 Vocabulary Game Server');
  console.log('========================================');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('API Endpoints:');
  console.log('  GET  /health              - Health check');
  console.log('  GET  /api/classes         - List all classes');
  console.log('  GET  /api/classes/:id     - Get class details');
  console.log('  POST /api/classes/:id     - Create/update class');
  console.log('  DEL  /api/classes/:id     - Delete class');
  console.log('  POST /api/results         - Save battle result');
  console.log('  GET  /api/results/:classId - Get class results');
  console.log('  GET  /api/tracking/:classId - Get vocabulary tracking');
  console.log('  GET  /api/review/:classId/:student - Get review words');
  console.log('  GET  /api/stats/:classId  - Get class statistics');
  console.log('  GET  /api/review-quiz/:classId - Generate review quiz');
  console.log('  GET  /api/dashboard       - Teacher dashboard');
  console.log('========================================');
});
