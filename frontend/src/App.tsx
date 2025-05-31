import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ArticleIcon from '@mui/icons-material/Article';
import PresentationLayout from './components/PresentationLayout';
import ContentPresentation from './components/ContentPresentation';
import PlainMarkdownViewer from './components/PlainMarkdownViewer';
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
      default: '#ffffff',
      paper: '#f8f9fa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    // Larger base font sizes for presentation
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '3rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1.5rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '1.25rem',
      lineHeight: 1.6,
    },
  },
});

const API_URL = 'http://localhost:3001/api';

type ViewMode = 'structured' | 'plain';

function App() {
  const [files, setFiles] = useState<FileTreeNode | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<any>(null);
  const [rawContent, setRawContent] = useState<string>('');
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>('');
  const [sections, setSections] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('structured');

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    // Extract section titles when content changes
    if (content && content.length > 0 && content[0].sections) {
      const sectionTitles = content[0].sections.map((section: any) => section.title);
      setSections(sectionTitles);
      // Only set first section if currentSection is empty
      if (!currentSection && sectionTitles.length > 0) {
        setCurrentSection(sectionTitles[0]);
      }
    }
  }, [content]);

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
    setCurrentSection(''); // Reset section when changing files
    try {
      const response = await axios.get(`${API_URL}/markdown/content`, {
        params: { path }
      });
      
      // Also fetch raw content for plain view
      const rawResponse = await axios.get(`${API_URL}/markdown/raw`, {
        params: { path }
      });
      
      setSelectedFile(path);
      setContent(JSON.parse(response.data.content));
      setRawContent(rawResponse.data);
      setHeadings(response.data.headings);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (direction: 'prev' | 'next') => {
    if (viewMode === 'plain') return; // No section navigation in plain mode
    
    const currentIndex = sections.findIndex(s => s === currentSection);
    if (direction === 'next' && currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1]);
    }
  };

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (viewMode === 'plain') return;
      
      if (e.key === 'ArrowLeft') {
        handleSectionChange('prev');
      } else if (e.key === 'ArrowRight') {
        handleSectionChange('next');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSection, sections, viewMode]);

  const handleSectionSelect = (section: string) => {
    setCurrentSection(section);
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const renderContent = useCallback(() => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography variant="h4">Loading...</Typography>
        </Box>
      );
    }

    if (!content && !rawContent) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography variant="h4">Select a file to view</Typography>
        </Box>
      );
    }

    if (viewMode === 'plain') {
      return <PlainMarkdownViewer content={rawContent} />;
    }

    return <ContentPresentation content={content} currentSection={currentSection} />;
  }, [loading, content, rawContent, viewMode, currentSection]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PresentationLayout
        files={files}
        currentFile={selectedFile}
        onFileSelect={handleFileSelect}
        currentSection={currentSection}
        sections={sections}
        onSectionChange={handleSectionChange}
        onSectionSelect={handleSectionSelect}
        showSectionControls={viewMode === 'structured'}
        extraControls={
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            sx={{ ml: 2 }}
          >
            <ToggleButton value="structured">
              <Tooltip title="Structured View">
                <ViewModuleIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="plain">
              <Tooltip title="Plain Markdown">
                <ArticleIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        }
      >
        {renderContent()}
      </PresentationLayout>
    </ThemeProvider>
  );
}

export default App;
