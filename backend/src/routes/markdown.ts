import { Router } from 'express';
import { MarkdownService } from '../services/markdownService';

const router = Router();
const markdownService = new MarkdownService();

router.get('/files', async (req, res) => {
  const files = await markdownService.listFiles();
  res.json(files);
});

router.get('/content', async (req, res) => {
  const { path } = req.query;
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Path parameter is required' });
  }
  
  const content = await markdownService.getContent(path);
  
  if (content) {
    res.json(content);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

export default router;
