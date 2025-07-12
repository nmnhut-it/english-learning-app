import express from 'express';
import cors from 'cors';
import path from 'path';
import markdownRoutes from './routes/markdown';
import vocabularyRoutes from './routes/vocabulary';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../../frontend')));

app.use('/api/markdown', markdownRoutes);
app.use('/api/vocabulary', vocabularyRoutes);

// Serve vocabulary tool
app.get('/vocabulary-tool', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/vocabulary-tool-node.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Vocabulary tool available at: http://localhost:${PORT}/vocabulary-tool`);
});
