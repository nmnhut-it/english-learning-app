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

// Serve the vocabulary tool
app.get('/vocabulary', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/vocabulary-tool.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`\nVocabulary Tool: http://localhost:${PORT}/vocabulary`);
  console.log(`API Endpoint: http://localhost:${PORT}/api/vocabulary/process`);
});
