import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton, 
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  InputAdornment,
  Divider,
  LinearProgress,
  Fab,
  Collapse,
  Chip
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import TextIncreaseIcon from '@mui/icons-material/TextIncrease';
import TextDecreaseIcon from '@mui/icons-material/TextDecrease';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import '../styles/print.css';
import '../styles/plain-mode-enhancements.css';

interface PlainMarkdownViewerProps {
  content: string;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

const PlainMarkdownViewer: React.FC<PlainMarkdownViewerProps> = ({ content }) => {
  const [fontSize, setFontSize] = useState(18);
  const [showTranslations, setShowTranslations] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number>(0);
  const [currentMatch, setCurrentMatch] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const contentRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  
  // Extract table of contents
  const toc = React.useMemo((): TOCItem[] => {
    const headings: TOCItem[] = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        headings.push({ id, text, level });
      }
    });
    
    return headings;
  }, [content]);
  
  // Process content to optionally hide translations
  const processedContent = React.useMemo(() => {
    if (showTranslations) return content;
    
    // Remove italicized Vietnamese translations
    return content
      .split('\n')
      .filter(line => !line.match(/^\*[^*]+\*$/))
      .join('\n');
  }, [content, showTranslations]);

  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setScrollProgress(progress);
        setShowScrollTop(scrollTop > 300);
      }
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            setSearchOpen(true);
            setTimeout(() => searchRef.current?.focus(), 100);
            break;
          case 'p':
            e.preventDefault();
            handlePrint();
            break;
          case '=':
          case '+':
            e.preventDefault();
            increaseFontSize();
            break;
          case '-':
            e.preventDefault();
            decreaseFontSize();
            break;
        }
      } else if (e.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false);
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [searchOpen]);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 32));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element && contentRef.current) {
      const offsetTop = element.offsetTop - 100;
      contentRef.current.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
    setTocOpen(false);
  };

  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Search functionality
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      // Simple search implementation - can be enhanced
      const matches = processedContent.toLowerCase().includes(query.toLowerCase());
      setSearchResults(matches ? 1 : 0);
    } else {
      setSearchResults(0);
    }
  }, [processedContent]);

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      {/* Progress Bar */}
      <LinearProgress 
        variant="determinate" 
        value={scrollProgress} 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 1100
        }}
      />

      {/* Search Bar */}
      <Collapse in={searchOpen}>
        <Paper 
          sx={{ 
            position: 'fixed',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            p: 1,
            zIndex: 1200,
            minWidth: 400,
            boxShadow: 4
          }}
        >
          <TextField
            inputRef={searchRef}
            fullWidth
            size="small"
            placeholder="Search in document..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {searchResults > 0 && (
                    <Chip 
                      size="small" 
                      label={`${searchResults} found`}
                      sx={{ mr: 1 }}
                    />
                  )}
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Paper>
      </Collapse>

      {/* Control Panel */}
      <Paper 
        sx={{ 
          position: 'fixed',
          top: 80,
          right: 20,
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1000,
          boxShadow: 3
        }}
      >
        <Tooltip title="Table of Contents (Ctrl+M)">
          <IconButton onClick={() => setTocOpen(!tocOpen)} size="small">
            <MenuIcon />
          </IconButton>
        </Tooltip>
        <Divider />
        <Tooltip title="Search (Ctrl+F)">
          <IconButton onClick={() => setSearchOpen(!searchOpen)} size="small">
            <SearchIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Print (Ctrl+P)">
          <IconButton onClick={handlePrint} size="small">
            <PrintIcon />
          </IconButton>
        </Tooltip>
        <Divider />
        <Tooltip title="Increase font size (Ctrl++)">
          <IconButton onClick={increaseFontSize} size="small">
            <TextIncreaseIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Decrease font size (Ctrl+-)">
          <IconButton onClick={decreaseFontSize} size="small">
            <TextDecreaseIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={showTranslations ? "Hide translations" : "Show translations"}>
          <IconButton 
            onClick={() => setShowTranslations(!showTranslations)} 
            size="small"
            color={showTranslations ? "primary" : "default"}
          >
            <SwapVertIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Table of Contents Drawer */}
      <Drawer
        anchor="left"
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
            top: 64,
            height: 'calc(100% - 64px)'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Table of Contents
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {toc.map((item, index) => {
              const isSection = item.level <= 2;
              const hasChildren = index < toc.length - 1 && toc[index + 1].level > item.level;
              
              return (
                <React.Fragment key={item.id}>
                  <ListItemButton 
                    onClick={() => {
                      scrollToHeading(item.id);
                      if (hasChildren && isSection) {
                        toggleSection(item.id);
                      }
                    }}
                    sx={{ 
                      pl: (item.level - 1) * 2,
                      py: 0.5
                    }}
                  >
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: item.level <= 2 ? '1rem' : '0.875rem',
                        fontWeight: item.level === 1 ? 600 : item.level === 2 ? 500 : 400
                      }}
                    />
                    {hasChildren && isSection && (
                      expandedSections.has(item.id) ? 
                        <ExpandLessIcon fontSize="small" /> : 
                        <ExpandMoreIcon fontSize="small" />
                    )}
                  </ListItemButton>
                  {hasChildren && isSection && (
                    <Collapse in={!expandedSections.has(item.id)} timeout="auto" unmountOnExit>
                      {/* Children will be rendered in subsequent iterations */}
                    </Collapse>
                  )}
                </React.Fragment>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Fab
          size="small"
          color="primary"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      )}

      {/* Markdown Content */}
      <Box
        ref={contentRef}
        className="plain-mode-content" 
        sx={{ 
          height: '100%',
          overflow: 'auto',
          '& > div': {
            maxWidth: 1200, 
            mx: 'auto', 
            p: { xs: 2, sm: 4 },
          },
          '& h1': {
            fontSize: `${fontSize * 2}px`,
            fontWeight: 700,
            my: 4
          },
          '& h2': {
            fontSize: `${fontSize * 1.5}px`,
            fontWeight: 600,
            my: 3
          },
          '& h3': {
            fontSize: `${fontSize * 1.25}px`,
            fontWeight: 600,
            my: 2
          },
          '& p': {
            fontSize: `${fontSize}px`,
            lineHeight: 1.8,
            my: 2
          },
          '& li': {
            fontSize: `${fontSize}px`,
            lineHeight: 1.8,
            my: 1
          },
          '& strong': {
            fontWeight: 600
          },
          '& em': {
            fontStyle: 'italic',
            color: 'text.secondary',
            display: showTranslations ? 'inline' : 'none'
          },
          '& table': {
            width: '100%',
            borderCollapse: 'collapse',
            my: 3,
            fontSize: `${fontSize * 0.9}px`
          },
          '& th': {
            p: 2,
            fontWeight: 600
          },
          '& td': {
            p: 2
          },
          '& blockquote': {
            ml: 0,
            my: 2,
            fontStyle: 'italic'
          },
          '& code': {
            fontFamily: 'monospace',
            fontSize: `${fontSize * 0.85}px`
          },
          '& pre': {
            overflow: 'auto',
            '& code': {
              backgroundColor: 'transparent',
              p: 0
            }
          },
          '& hr': {
            my: 4,
            borderColor: 'divider'
          }
        }}
      >
        <div>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom renderers for better typography and navigation
              h1: ({children}) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                return (
                  <Typography variant="h1" component="h1" id={id} gutterBottom>
                    {children}
                  </Typography>
                );
              },
              h2: ({children}) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                return (
                  <Typography variant="h2" component="h2" id={id} gutterBottom>
                    {children}
                  </Typography>
                );
              },
              h3: ({children}) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                return (
                  <Typography variant="h3" component="h3" id={id} gutterBottom>
                    {children}
                  </Typography>
                );
              },
              h4: ({children}) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                return (
                  <Typography variant="h4" component="h4" id={id} gutterBottom>
                    {children}
                  </Typography>
                );
              },
              h5: ({children}) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                return (
                  <Typography variant="h5" component="h5" id={id} gutterBottom>
                    {children}
                  </Typography>
                );
              },
              h6: ({children}) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                return (
                  <Typography variant="h6" component="h6" id={id} gutterBottom>
                    {children}
                  </Typography>
                );
              },
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      </Box>
    </Box>
  );
};

export default PlainMarkdownViewer;
