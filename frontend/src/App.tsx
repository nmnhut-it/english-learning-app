import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Tooltip, IconButton, Chip, Divider } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ArticleIcon from '@mui/icons-material/Article';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PresentationLayout from './components/PresentationLayout';
import ContentPresentation from './components/ContentPresentation';
import PlainMarkdownViewer from './components/PlainMarkdownViewer';
import { FileTreeNode, Heading } from './types';
import axios from 'axios';
import './styles/teacher-mode.css';

// Lightweight theme with reduced animations
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF5722', // Deep Orange
      light: '#FF8A65',
      dark: '#E64A19',
    },
    secondary: {
      main: '#FF6E40', // Orange
      light: '#FFAB91',
      dark: '#FF3D00',
    },
    background: {
      default: '#FFF3E0', // Very light orange tint
      paper: 'rgba(255, 255, 255, 0.95)',
    },
    text: {
      primary: '#000000',
      secondary: 'rgba(0, 0, 0, 0.7)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    // Teacher-optimized sizes - reduced hierarchy
    h1: {
      fontSize: '2.5rem',
      fontWeight: 800,
      lineHeight: 1.2,
      color: '#FF5722',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.3,
      color: '#FF5722',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#FF5722',
    },
    h4: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#FF5722',
    },
    h5: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.4,
      color: '#FF5722',
    },
    body1: {
      fontSize: '1.75rem',
      lineHeight: 1.8,
      fontWeight: 400,
      color: '#000000',
    },
    body2: {
      fontSize: '1.625rem',
      lineHeight: 1.7,
      color: '#000000',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#f8f9fa',
          minHeight: '100vh',
        },
        // Remove animations for better performance
        '*': {
          animationDuration: '0.2s !important',
          transitionDuration: '0.2s !important',
        },
      },
    },
  },
});

const API_URL = 'http://0.0.0.0:3001/api';

type ViewMode = 'structured' | 'plain';
type ContentFilter = 'all' | 'vocabulary';

// Helper function to parse URL parameters
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    file: params.get('file') || null,
    section: params.get('section') || null,
    mode: params.get('mode') as ViewMode || 'structured',
    filter: params.get('filter') as ContentFilter || 'all',
    fontSize: parseInt(params.get('fontSize') || '28'),
  };
}

// Helper function to update URL without page reload
function updateUrl(params: {
  file?: string | null;
  section?: string | null;
  mode?: ViewMode;
  filter?: ContentFilter;
  fontSize?: number;
}) {
  const currentParams = getUrlParams();
  const newParams = new URLSearchParams();
  
  if (params.file !== undefined) {
    if (params.file) newParams.set('file', params.file);
  } else if (currentParams.file) {
    newParams.set('file', currentParams.file);
  }
  
  if (params.section !== undefined) {
    if (params.section) newParams.set('section', params.section);
  } else if (currentParams.section) {
    newParams.set('section', currentParams.section);
  }
  
  const mode = params.mode !== undefined ? params.mode : currentParams.mode;
  if (mode !== 'structured') newParams.set('mode', mode);
  
  const filter = params.filter !== undefined ? params.filter : currentParams.filter;
  if (filter !== 'all') newParams.set('filter', filter);
  
  const fontSize = params.fontSize !== undefined ? params.fontSize : currentParams.fontSize;
  if (fontSize !== 28) newParams.set('fontSize', fontSize.toString());
  
  const url = newParams.toString() ? `?${newParams.toString()}` : window.location.pathname;
  window.history.replaceState({}, '', url);
}

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
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [structuredFontSize, setStructuredFontSize] = useState<number>(28);
  const [readAloudEnabled, setReadAloudEnabled] = useState(false);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [urlInitialized, setUrlInitialized] = useState(false);

  // Initialize from URL parameters
  useEffect(() => {
    const params = getUrlParams();
    setViewMode(params.mode);
    setContentFilter(params.filter);
    setStructuredFontSize(params.fontSize);
    if (params.section) {
      setCurrentSection(params.section);
    }
    setUrlInitialized(true);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, []);

  // Handle URL-based file selection
  useEffect(() => {
    if (files && urlInitialized) {
      const urlParams = getUrlParams();
      if (urlParams.file && urlParams.file !== selectedFile) {
        handleFileSelect(urlParams.file, false);
      } else if (!urlParams.file && !selectedFile) {
        // No file in URL, select first available file
        const firstFile = findFirstFile(files);
        if (firstFile) {
          handleFileSelect(firstFile.path, true);
        }
      }
    }
  }, [files, urlInitialized]);

  // Update URL when section changes
  useEffect(() => {
    if (urlInitialized && currentSection) {
      updateUrl({ section: currentSection });
    }
  }, [currentSection, urlInitialized]);

  // Update URL when view settings change
  useEffect(() => {
    if (urlInitialized) {
      updateUrl({ mode: viewMode, filter: contentFilter, fontSize: structuredFontSize });
    }
  }, [viewMode, contentFilter, structuredFontSize, urlInitialized]);

  useEffect(() => {
    // Extract section titles when content changes
    if (content && content.length > 0 && content[0].sections) {
      const sectionTitles = content[0].sections.map((section: any) => section.title);
      setSections(sectionTitles);
      
      // Check if URL has a section parameter
      const urlParams = getUrlParams();
      if (urlParams.section && sectionTitles.includes(urlParams.section)) {
        setCurrentSection(urlParams.section);
      } else if (!currentSection && sectionTitles.length > 0) {
        setCurrentSection(sectionTitles[0]);
      }
    }
  }, [content]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API_URL}/markdown/files`);
      setFiles(response.data);
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

  const handleFileSelect = async (path: string, updateUrlParam: boolean = true) => {
    setLoading(true);
    setCurrentSection('');
    try {
      const response = await axios.get(`${API_URL}/markdown/content`, {
        params: { path }
      });
      
      const parsedContent = JSON.parse(response.data.content);
      
      const rawResponse = await axios.get(`${API_URL}/markdown/raw`, {
        params: { path }
      });
      
      setSelectedFile(path);
      setContent(parsedContent);
      setRawContent(rawResponse.data);
      setHeadings(response.data.headings);
      
      if (updateUrlParam) {
        updateUrl({ file: path, section: null });
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = useCallback((direction: 'prev' | 'next') => {
    if (viewMode === 'plain') return;
    
    const currentIndex = sections.findIndex(s => s === currentSection);
    if (direction === 'next' && currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1]);
    }
  }, [viewMode, sections, currentSection]);

  // Enhanced keyboard navigation for teachers
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Show/hide hotkey help
      if (e.key === 'F1') {
        e.preventDefault();
        setShowHotkeys(!showHotkeys);
        return;
      }

      if (viewMode === 'plain') return;
      
      // Font size controls
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            setStructuredFontSize(prev => Math.min(48, prev + 2));
            break;
          case '-':
            e.preventDefault();
            setStructuredFontSize(prev => Math.max(16, prev - 2));
            break;
          case '0':
            e.preventDefault();
            setStructuredFontSize(28); // Reset to default
            break;
        }
        return;
      }

      // Single key navigation for teachers
      switch (e.key) {
        case 'ArrowLeft':
          handleSectionChange('prev');
          break;
        case 'ArrowRight':
          handleSectionChange('next');
          break;
        case 'v':
        case 'V':
          // Toggle vocabulary mode
          setContentFilter(prev => prev === 'vocabulary' ? 'all' : 'vocabulary');
          break;
        case 'p':
        case 'P':
          // Toggle between plain and structured
          setViewMode(prev => prev === 'plain' ? 'structured' : 'plain');
          break;
        case 'r':
        case 'R':
          // Toggle read aloud
          setReadAloudEnabled(prev => !prev);
          break;
        case 'Home':
          if (sections.length > 0) {
            setCurrentSection(sections[0]);
          }
          break;
        case 'End':
          if (sections.length > 0) {
            setCurrentSection(sections[sections.length - 1]);
          }
          break;
        // Number keys for section navigation
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          const sectionNum = parseInt(e.key) - 1;
          if (sectionNum < sections.length) {
            setCurrentSection(sections[sectionNum]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [viewMode, handleSectionChange, sections, showHotkeys]);

  const handleSectionSelect = (section: string) => {
    setCurrentSection(section);
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = getUrlParams();
      
      if (params.file && params.file !== selectedFile) {
        handleFileSelect(params.file, false);
      }
      
      if (params.section && sections.includes(params.section)) {
        setCurrentSection(params.section);
      }
      
      setViewMode(params.mode);
      setContentFilter(params.filter);
      setStructuredFontSize(params.fontSize);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedFile, sections]);

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
      return <PlainMarkdownViewer content={rawContent} hasHeader={headerVisible} />;
    }

    return (
      <ContentPresentation 
        key={`${structuredFontSize}-${contentFilter}`} 
        content={content} 
        currentSection={currentSection} 
        fontSize={structuredFontSize}
        contentFilter={contentFilter}
        readAloudEnabled={readAloudEnabled}
      />
    );
  }, [loading, content, rawContent, viewMode, currentSection, structuredFontSize, contentFilter, readAloudEnabled, headerVisible]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Hotkey Help Overlay */}
      {showHotkeys && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            zIndex: 9999,
            maxWidth: 500,
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
            🎯 Teacher Hotkeys
          </Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography><kbd>V</kbd> - Toggle Vocabulary Mode</Typography>
            <Typography><kbd>P</kbd> - Switch Plain/Structured View</Typography>
            <Typography><kbd>R</kbd> - Toggle Read Aloud</Typography>
            <Typography><kbd>H</kbd> - Show/Hide Header & Footer</Typography>
            <Typography><kbd>←/→</kbd> - Navigate Sections</Typography>
            <Typography><kbd>1-9</kbd> - Jump to Section (by number)</Typography>
            <Typography><kbd>Ctrl +/-</kbd> - Adjust Font Size</Typography>
            <Typography><kbd>Ctrl 0</kbd> - Reset Font Size</Typography>
            <Typography><kbd>Home/End</kbd> - First/Last Section</Typography>
            <Typography><kbd>F1</kbd> - Toggle This Help</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>In Vocabulary Mode:</Typography>
            <Typography><kbd>←→↑↓</kbd> or <kbd>,.</kbd> - Navigate Words</Typography>
            <Typography><kbd>1-9</kbd> - Jump to Word (by number)</Typography>
            <Typography><kbd>Space</kbd> - Speak Word</Typography>
            <Typography><kbd>Enter</kbd> - Show/Hide Meaning</Typography>
            <Typography><kbd>S</kbd> - Show/Hide Spelling</Typography>
            <Typography><kbd>A</kbd> - Auto-play</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>🖱️ Also supports mouse wheel & touch swipe!</Typography>
          </Box>
          <Typography sx={{ mt: 2, fontStyle: 'italic' }}>
            Press F1 to close
          </Typography>
        </Box>
      )}
      
      <PresentationLayout
        files={files}
        currentFile={selectedFile}
        onFileSelect={(path) => handleFileSelect(path, true)}
        currentSection={currentSection}
        sections={sections}
        onSectionChange={handleSectionChange}
        onSectionSelect={handleSectionSelect}
        showSectionControls={viewMode === 'structured'}
        onHeaderVisibilityChange={setHeaderVisible}
        extraControls={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            {/* Teacher Mode Indicator */}
            <Chip
              icon={<SchoolIcon />}
              label="Teacher Mode"
              color="primary"
              size="small"
              sx={{ mr: 1 }}
            />
            
            {/* View Mode Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="structured">
                <Tooltip title="Structured View (P)">
                  <ViewModuleIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="plain">
                <Tooltip title="Plain Markdown (P)">
                  <ArticleIcon />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            
            {/* Vocabulary Filter - Only in structured mode */}
            {viewMode === 'structured' && (
              <ToggleButton
                value="vocabulary"
                selected={contentFilter === 'vocabulary'}
                onChange={() => setContentFilter(prev => prev === 'vocabulary' ? 'all' : 'vocabulary')}
                size="small"
                sx={{ ml: 1 }}
              >
                <Tooltip title="Vocabulary Only (V)">
                  <MenuBookIcon />
                </Tooltip>
              </ToggleButton>
            )}
            
            {/* Read Aloud Toggle */}
            {viewMode === 'structured' && (
              <ToggleButton
                value="readAloud"
                selected={readAloudEnabled}
                onChange={() => setReadAloudEnabled(!readAloudEnabled)}
                size="small"
              >
                <Tooltip title="Read Aloud (R)">
                  <VolumeUpIcon />
                </Tooltip>
              </ToggleButton>
            )}
            
            {/* Font Size Controls */}
            {viewMode === 'structured' && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5, 
                ml: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                px: 0.5,
                backgroundColor: 'background.paper'
              }}>
                <Tooltip title="Decrease font size (Ctrl -)">
                  <IconButton 
                    size="small" 
                    onClick={() => setStructuredFontSize(prev => Math.max(16, prev - 2))}
                    disabled={structuredFontSize <= 16}
                    sx={{ p: 0.5 }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    minWidth: 45, 
                    textAlign: 'center',
                    fontWeight: 600,
                    color: 'primary.main',
                  }}
                >
                  {structuredFontSize}px
                </Typography>
                <Tooltip title="Increase font size (Ctrl +)">
                  <IconButton 
                    size="small" 
                    onClick={() => setStructuredFontSize(prev => Math.min(48, prev + 2))}
                    disabled={structuredFontSize >= 48}
                    sx={{ p: 0.5 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            
            {/* Hotkey Help */}
            <Tooltip title="Show Hotkeys (F1)">
              <IconButton
                size="small"
                onClick={() => setShowHotkeys(!showHotkeys)}
                sx={{ ml: 1 }}
              >
                <KeyboardIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      >
        {renderContent()}
      </PresentationLayout>
    </ThemeProvider>
  );
}

export default App;