import express from 'express';
import cors from 'cors';
import path from 'path';
import markdownRoutes from './routes/markdown';
import vocabularyRoutes from './routes/vocabulary';
import translationRoutes from './routes/translation';
import vocabularyExportRoutes from './routes/vocabulary-export';
import quizRoutes from './routes/quiz';

const app = express();
const PORT = process.env.PORT || 10001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/markdown', markdownRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/vocabulary-export', vocabularyExportRoutes);
app.use('/api/quiz', quizRoutes);

// Serve static files from the static directory
app.use('/static', express.static(path.join(__dirname, '../../frontend/static')));

// Serve the vocabulary tool
app.get('/vocabulary', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/vocabulary-tool.html'));
});

// Serve the vocabulary quiz
app.get('/vocabulary-quiz', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/static/vocabulary-quiz.html'));
});

// Serve the enhanced vocabulary quiz with Gemini preview
app.get('/vocabulary-quiz-enhanced', (req, res) => {
  res.sendFile(path.join(__dirname, '../vocabulary-quiz-enhanced.html'));
});

// Serve the formatted data viewer
app.get('/formatted-data-viewer', (req, res) => {
  res.sendFile(path.join(__dirname, '../formatted-data-viewer.html'));
});

// Serve the format data test page
app.get('/format-data-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../format-data-test.html'));
});

// Serve the simple format data test page
app.get('/format-data-test-simple', (req, res) => {
  res.sendFile(path.join(__dirname, '../format-data-test-simple.html'));
});

// Serve the translation helper
app.get('/translation-helper', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/translation-helper.html'));
});

// Serve the teacher dashboard
app.get('/teacher-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/teacher-dashboard.html'));
});

// Serve the vocabulary review page
app.get('/vocabulary-review', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/vocabulary-review.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`\nAvailable Routes:`);
  console.log(`Vocabulary Tool: http://localhost:${PORT}/vocabulary`);
  console.log(`Vocabulary Quiz: http://localhost:${PORT}/vocabulary-quiz`);
  console.log(`Vocabulary Quiz Enhanced: http://localhost:${PORT}/vocabulary-quiz-enhanced`);
  console.log(`Formatted Data Viewer: http://localhost:${PORT}/formatted-data-viewer`);
  console.log(`Format Data Test: http://localhost:${PORT}/format-data-test`);
  console.log(`Translation Helper: http://localhost:${PORT}/translation-helper`);
  console.log(`Teacher Dashboard: http://localhost:${PORT}/teacher-dashboard`);
  console.log(`Vocabulary Review: http://localhost:${PORT}/vocabulary-review`);
  console.log(`\nAPI Endpoints:`);
  console.log(`Process Vocabulary: http://localhost:${PORT}/api/vocabulary/process`);
  console.log(`Format Data: http://localhost:${PORT}/api/vocabulary/format-data`);
  console.log(`Translation API: http://localhost:${PORT}/api/translations/*`);
  console.log(`Vocabulary Export API: http://localhost:${PORT}/api/vocabulary-export/*`);
  console.log(`Quiz API: http://localhost:${PORT}/api/quiz/*`);
});
