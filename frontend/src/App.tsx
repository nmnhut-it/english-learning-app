import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Tooltip, IconButton } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ArticleIcon from '@mui/icons-material/Article';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PresentationLayout from './components/PresentationLayout';
import ContentPresentation from './components/ContentPresentation';
import PlainMarkdownViewer from './components/PlainMarkdownViewer';
import { FileTreeNode, Heading } from './types';
import axios from 'axios';
import './styles/holographic-theme.css';

// Add parallax effect on mouse move
if (typeof window !== 'undefined') {
  document.addEventListener('mousemove', (e) => {
    const orbs = document.querySelectorAll('.orb');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    orbs.forEach((orb, index) => {
      const speed = (index + 1) * 20;
      (orb as HTMLElement).style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  });
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#00D084',  // Bio-tech green
      light: '#4ADE80',  // Light green
      dark: '#059669',   // Deep forest green
    },
    secondary: {
      main: '#10B981',   // Emerald
      light: '#86EFAC',  // Mint
      dark: '#047857',   // Dark emerald
    },
    background: {
      default: '#ffffff',
      paper: 'rgba(255, 255, 255, 0.8)',
    },
    text: {
      primary: '#000000',      // Pure black for maximum readability
      secondary: 'rgba(0, 0, 0, 0.7)',  // Dark gray
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    // Extra large sizes for classroom projection
    h1: {
      fontSize: '6rem',      // Increased from 5.5rem
      fontWeight: 800,
      lineHeight: 1.2,
      color: '#000000',
    },
    h2: {
      fontSize: '5rem',      // Increased from 4.5rem
      fontWeight: 700,
      lineHeight: 1.3,
      color: '#000000',
    },
    h3: {
      fontSize: '4rem',      // Increased from 3.5rem
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#000000',
    },
    h4: {
      fontSize: '3.2rem',    // Increased from 2.8rem
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#000000',
    },
    h5: {
      fontSize: '2.5rem',    // Increased from 2.2rem
      fontWeight: 500,
      lineHeight: 1.4,
      color: '#000000',
    },
    body1: {
      fontSize: '2.25rem',   // Increased from 2rem
      lineHeight: 1.8,
      fontWeight: 400,
      color: '#000000',
    },
    body2: {
      fontSize: '2rem',      // Increased from 1.75rem
      lineHeight: 1.7,
      color: '#000000',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #E6FFFA 0%, #D1FAE5 40%, #A7F3D0 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 25s ease infinite',
          minHeight: '100vh',
        },
        '@keyframes gradientShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
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
  const [structuredFontSize, setStructuredFontSize] = useState<number>(20); // Base font size optimized for screen

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
      
      console.log('\n=== API Response ===');
      console.log('response.data:', response.data);
      console.log('typeof response.data.content:', typeof response.data.content);
      
      const parsedContent = JSON.parse(response.data.content);
      console.log('\n=== Parsed Content ===');
      console.log('parsedContent:', parsedContent);
      
      // Check vocabulary in parsed content
      if (parsedContent[0]?.sections?.[0]?.subsections) {
        const vocabSubsection = parsedContent[0].sections[0].subsections.find((sub: any) => sub.type === 'vocabulary');
        if (vocabSubsection) {
          console.log('\n=== Vocabulary Subsection Found ===');
          console.log('First vocab item:', vocabSubsection.content[0]);
          console.log('Type of first item:', typeof vocabSubsection.content[0]);
        }
      }
      
      // Also fetch raw content for plain view
      const rawResponse = await axios.get(`${API_URL}/markdown/raw`, {
        params: { path }
      });
      
      setSelectedFile(path);
      setContent(parsedContent);
      setRawContent(rawResponse.data);
      setHeadings(response.data.headings);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = useCallback((direction: 'prev' | 'next') => {
    if (viewMode === 'plain') return; // No section navigation in plain mode
    
    const currentIndex = sections.findIndex(s => s === currentSection);
    if (direction === 'next' && currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1]);
    }
  }, [viewMode, sections, currentSection]);

  // Add keyboard navigation and font size controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (viewMode === 'plain') return;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            setStructuredFontSize(prev => Math.min(32, prev + 2));
            break;
          case '-':
            e.preventDefault();
            setStructuredFontSize(prev => Math.max(16, prev - 2));
            break;
        }
      } else if (e.key === 'ArrowLeft') {
        handleSectionChange('prev');
      } else if (e.key === 'ArrowRight') {
        handleSectionChange('next');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [viewMode, handleSectionChange]);

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

    return <ContentPresentation key={structuredFontSize} content={content} currentSection={currentSection} fontSize={structuredFontSize} />;
  }, [loading, content, rawContent, viewMode, currentSection, structuredFontSize]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Floating orbs for organic depth */}
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />
      
      {/* Floating leaves for garden effect */}
      {[...Array(5)].map((_, i) => (
        <div 
          key={i} 
          className="leaf" 
          style={{ 
            left: `${Math.random() * 100}%`, 
            animationDelay: `${i * 3}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }} 
        />
      ))}
      
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
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
                    transition: 'all 0.2s ease',
                    transform: structuredFontSize === 16 ? 'scale(1)' : 'scale(1.1)'
                  }}
                >
                  {structuredFontSize}px
                </Typography>
                <Tooltip title="Increase font size (Ctrl +)">
                  <IconButton 
                    size="small" 
                    onClick={() => setStructuredFontSize(prev => Math.min(32, prev + 2))}
                    disabled={structuredFontSize >= 32}
                    sx={{ p: 0.5 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        }
      >
        {renderContent()}
      </PresentationLayout>
    </ThemeProvider>
  );
}

export default App;
