const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Markdown files directory
const MARKDOWN_DIR = path.join(__dirname, '../markdown-files');

// Helper function to scan directory and build file tree
async function scanDirectory(dirPath, relativePath = '') {
  try {
    const stats = await fs.stat(dirPath);
    const name = path.basename(dirPath);
    
    if (!stats.isDirectory()) {
      throw new Error('Not a directory');
    }

    const node = {
      name: name === 'markdown-files' ? 'Lessons' : name,
      path: relativePath,
      type: 'folder',
      files: [],
      children: []
    };

    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const itemRelativePath = relativePath ? path.join(relativePath, item).replace(/\\/g, '/') : item;
      const itemStats = await fs.stat(itemPath);
      
      if (itemStats.isDirectory()) {
        const childNode = await scanDirectory(itemPath, itemRelativePath);
        node.children.push(childNode);
      } else if (item.endsWith('.md')) {
        // Extract title from markdown file
        try {
          const content = await fs.readFile(itemPath, 'utf-8');
          const { data } = matter(content);
          
          // Get title from frontmatter or first heading
          let title = data.title;
          if (!title) {
            const lines = content.split('\n');
            for (const line of lines) {
              const match = line.match(/^#\s+(.+)$/);
              if (match) {
                title = match[1].trim();
                break;
              }
            }
          }
          
          // Fallback to filename
          if (!title) {
            title = item.replace('.md', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
          
          node.files.push({
            name: item,
            path: itemRelativePath,
            title,
            modified: itemStats.mtime
          });
        } catch (error) {
          console.error(`Error reading file ${itemPath}:`, error);
        }
      }
    }
    
    // Sort children and files
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.files.sort((a, b) => a.name.localeCompare(b.name));
    
    return node;
  } catch (error) {
    console.error('Error scanning directory:', error);
    return { name: 'root', path: '', type: 'folder', files: [], children: [] };
  }
}

// Routes
app.get('/', async (req, res) => {
  try {
    const fileTree = await scanDirectory(MARKDOWN_DIR);
    res.render('index', { fileTree });
  } catch (error) {
    console.error('Error loading file tree:', error);
    res.status(500).send('Error loading file tree');
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const fileTree = await scanDirectory(MARKDOWN_DIR);
    res.json(fileTree);
  } catch (error) {
    console.error('Error loading file tree:', error);
    res.status(500).json({ error: 'Error loading file tree' });
  }
});

app.get('/view/:filepath(*)', async (req, res) => {
  try {
    const filepath = req.params.filepath;
    const fullPath = path.join(MARKDOWN_DIR, filepath);
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).send('File not found');
    }
    
    const content = await fs.readFile(fullPath, 'utf-8');
    const { content: markdownContent, data } = matter(content);
    
    // Render markdown to HTML
    const htmlContent = marked(markdownContent);
    
    const title = data.title || 
                  markdownContent.split('\n').find(line => line.match(/^#\s+(.+)$/))?.replace(/^#\s+/, '') ||
                  path.basename(filepath, '.md').replace(/_/g, ' ');
    
    res.render('viewer', {
      title,
      filepath,
      rawContent: markdownContent,
      htmlContent,
      frontmatter: data
    });
  } catch (error) {
    console.error('Error loading file:', error);
    res.status(500).send('Error loading file');
  }
});

app.get('/raw/:filepath(*)', async (req, res) => {
  try {
    const filepath = req.params.filepath;
    const fullPath = path.join(MARKDOWN_DIR, filepath);
    
    const content = await fs.readFile(fullPath, 'utf-8');
    const { content: markdownContent } = matter(content);
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(markdownContent);
  } catch (error) {
    console.error('Error loading raw file:', error);
    res.status(500).send('Error loading file');
  }
});

// API endpoint for updating file access history
app.post('/api/history', (req, res) => {
  // This will be handled client-side with localStorage
  // But we can log server-side if needed
  const { filepath, timestamp } = req.body;
  console.log(`File accessed: ${filepath} at ${new Date(timestamp)}`);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`V3 Markdown Viewer running on http://localhost:${PORT}`);
  console.log(`Looking for markdown files in: ${MARKDOWN_DIR}`);
});