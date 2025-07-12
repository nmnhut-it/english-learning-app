import express from 'express';
import path from 'path';

const app = express();
const PORT = 3002; // Different port for vocabulary tools

// Serve static files
app.use(express.static(path.join(__dirname, '../../frontend')));

// Vocabulary tools routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/vocabulary-tools-index.html'));
});

app.get('/vocabulary-tool', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/vocabulary-tool-node.html'));
});

app.get('/vocabulary-tool-enhanced', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/vocabulary-tool-node-enhanced.html'));
});

app.get('/vocabulary-tool-streamlined', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/vocabulary-tool-streamlined.html'));
});

app.listen(PORT, () => {
  console.log(`Vocabulary Tools Server running on port ${PORT}`);
  console.log(`\nAccess vocabulary tools at:`);
  console.log(`- Hub: http://localhost:${PORT}/`);
  console.log(`- Streamlined (Recommended): http://localhost:${PORT}/vocabulary-tool-streamlined`);
  console.log(`- Original: http://localhost:${PORT}/vocabulary-tool`);
  console.log(`- Enhanced: http://localhost:${PORT}/vocabulary-tool-enhanced`);
});
