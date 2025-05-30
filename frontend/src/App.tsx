import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Layout from './components/Layout';
import FileList from './components/FileList';
import ContentViewer from './components/ContentViewer';
import TableOfContents from './components/TableOfContents';
import { FileTreeNode, Heading } from './types';
import axios from 'axios';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
  },
});

const API_URL = 'http://localhost:3001/api';

function App() {
  const [files, setFiles] = useState<FileTreeNode | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<any>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API_URL}/markdown/files`);
      setFiles(response.data);
      
      // Auto-select first file if exists
      if (!selectedFile) {
        const firstFile = findFirstFile(response.data);
        if (firstFile) {
          handleFileSelect(firstFile.path);
        }
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const findFirstFile = (node: FileTreeNode): FileTreeNode | null => {
    if (node.type === 'file') return node;
    if (node.children) {
      for (const child of node.children) {
        const file = findFirstFile(child);
        if (file) return file;
      }
    }
    return null;
  };

  const handleFileSelect = async (path: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/markdown/content`, {
        params: { path }
      });
      setSelectedFile(path);
      setContent(JSON.parse(response.data.content));
      setHeadings(response.data.headings);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Box sx={{ display: 'flex', height: '100%' }}>
          <FileList 
            files={files} 
            selectedFile={selectedFile} 
            onFileSelect={handleFileSelect} 
          />
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {loading ? (
              <Box>Loading...</Box>
            ) : content ? (
              <ContentViewer content={content} />
            ) : (
              <Box>Select a file to view</Box>
            )}
          </Box>
          <TableOfContents headings={headings} />
        </Box>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
