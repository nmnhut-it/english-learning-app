import express from 'express';
import cors from 'cors';
import path from 'path';
import markdownRoutes from './routes/markdown';
import vocabularyRoutes from './routes/vocabulary';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/markdown', markdownRoutes);
app.use('/api/vocabulary', vocabularyRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`\nVocabulary Tool: http://localhost:${PORT}/vocabulary`);
  console.log(`Vocabulary Quiz: http://localhost:${PORT}/vocabulary-quiz`);
  console.log(`Vocabulary Quiz Enhanced: http://localhost:${PORT}/vocabulary-quiz-enhanced`);
  console.log(`API Endpoint: http://localhost:${PORT}/api/vocabulary/process`);
});
