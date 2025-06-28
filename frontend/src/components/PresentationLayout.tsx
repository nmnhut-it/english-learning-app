import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Divider,
  useTheme,
  Breadcrumbs,
  Link,
  Collapse,
  Fab,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { FileTreeNode } from '../types';

interface PresentationLayoutProps {
  children: React.ReactNode;
  files: FileTreeNode | null;
  currentFile: string | null;
  onFileSelect: (path: string) => void;
  currentSection?: string;
  sections?: string[];
  onSectionChange?: (direction: 'prev' | 'next') => void;
  onSectionSelect?: (section: string) => void;
  showSectionControls?: boolean;
  extraControls?: React.ReactNode;
}

const PresentationLayout: React.FC<PresentationLayoutProps> = ({
  children,
  files,
  currentFile,
  onFileSelect,
  currentSection,
  sections = [],
  onSectionChange,
  onSectionSelect,
  showSectionControls = true,
  extraControls,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false); // Hidden by default

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFileClick = (path: string) => {
    onFileSelect(path);
    handleMenuClose();
  };

  const renderFileMenu = (node: FileTreeNode, level = 0): React.ReactNode => {
    if (!node.children) return null;
    
    return node.children.map((child) => {
      if (child.type === 'file') {
        // Group units and reviews
        const isReview = child.name.toLowerCase().includes('review');
        const unitMatch = child.name.match(/unit[\s-]*(\d+)/i);
        const unitNumber = unitMatch ? parseInt(unitMatch[1]) : 0;
        
        return (
          <MenuItem
            key={child.path}
            onClick={() => handleFileClick(child.path)}
            selected={currentFile === child.path}
            sx={{
              pl: level * 2 + 2,
              fontSize: '1rem',
              fontWeight: currentFile === child.path ? 600 : 400,
              backgroundColor: isReview ? 'action.hover' : 'transparent',
              '&:hover': {
                backgroundColor: isReview ? 'action.selected' : 'action.hover',
              },
              // Add visual grouping
              mt: isReview || (unitNumber > 1 && (unitNumber - 1) % 3 === 0) ? 1 : 0,
              borderTop: isReview || (unitNumber > 1 && (unitNumber - 1) % 3 === 0) 
                ? `1px solid ${theme.palette.divider}` 
                : 'none',
              pt: isReview || (unitNumber > 1 && (unitNumber - 1) % 3 === 0) ? 1 : 0.5,
            }}
          >
            {child.title || child.name}
          </MenuItem>
        );
      } else {
        return (
          <Box key={child.path}>
            <MenuItem disabled sx={{ pl: level * 2 + 2, fontWeight: 600 }}>
              {child.name}
            </MenuItem>
            {renderFileMenu(child, level + 1)}
          </Box>
        );
      }
    });
  };

  const getCurrentSectionIndex = () => {
    if (!currentSection || sections.length === 0) return -1;
    return sections.findIndex(s => s === currentSection);
  };

  const canGoNext = getCurrentSectionIndex() < sections.length - 1;
  const canGoPrev = getCurrentSectionIndex() > 0;

  // Add keyboard shortcut for header toggle
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setHeaderVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      backgroundColor: 'background.default',
    }}>
      {/* Collapsible Header */}
      <Collapse in={headerVisible}>
        <AppBar 
          position="static" 
          elevation={0}
          className="glass-nav"
          sx={{ 
            backgroundColor: 'transparent !important',
            borderBottom: `1px solid rgba(0, 0, 0, 0.08)`,
            color: 'text.primary',
          }}
        >
          <Toolbar 
            variant="dense" 
            sx={{ 
              minHeight: 48,
              px: { xs: 1, sm: 2 },
            }}
          >
            {/* File Menu */}
            <Button
              variant="contained"
              startIcon={<MenuIcon />}
              onClick={handleMenuOpen}
              sx={{ 
                mr: 2,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #00D084, #10B981)',
                boxShadow: '0 4px 20px rgba(0, 208, 132, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #10B981, #00D084)',
                  boxShadow: '0 6px 30px rgba(0, 208, 132, 0.4)',
                },
              }}
            >
              Files
            </Button>
            
            {/* Breadcrumb Navigation */}
            <Breadcrumbs 
              separator="›" 
              sx={{ 
                flexGrow: 1,
                '& .MuiBreadcrumbs-separator': { mx: 1 },
              }}
            >
              <Link
                color="inherit"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Could navigate to home or file list
                }}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />
              </Link>
              {currentFile && (
                <Typography color="text.primary" sx={{ fontSize: '1.1rem', fontWeight: 500, color: '#000000' }}>
                {(() => {
                    // Find the file in the tree to get its title
                    const findFileTitle = (node: FileTreeNode, path: string): string | null => {
                      if (node.type === 'file' && node.path === path) {
                        return node.title || node.name.replace(/\.md$/, '').replace(/[-_]/g, ' ');
                      }
                      if (node.children) {
                        for (const child of node.children) {
                          const title = findFileTitle(child, path);
                          if (title) return title;
                        }
                      }
                      return null;
                    };
                    return files ? findFileTitle(files, currentFile) || currentFile : currentFile;
                  })()}
                </Typography>
              )}
              {currentSection && (
                <Typography color="primary" sx={{ fontSize: '1.1rem', fontWeight: 600, color: '#000000' }}>
                  {currentSection}
                </Typography>
              )}
            </Breadcrumbs>

            {/* Extra Controls (View Mode Toggle) */}
            {extraControls}

            {/* Section Navigation */}
            {showSectionControls && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                <IconButton
                  size="small"
                  onClick={() => onSectionChange?.('prev')}
                  disabled={!canGoPrev}
                >
                  <NavigateBeforeIcon />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center' }}>
                  {getCurrentSectionIndex() + 1} / {sections.length}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => onSectionChange?.('next')}
                  disabled={!canGoNext}
                >
                  <NavigateNextIcon />
                </IconButton>
              </Box>
            )}
          </Toolbar>
        </AppBar>
      </Collapse>

      {/* Header Toggle Button */}
      <Box sx={{ 
        position: 'fixed', 
        top: headerVisible ? 56 : 8, 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 1100,
        transition: 'top 0.3s ease',
      }}>
        <Fab
          size="small"
          color="primary"
          onClick={() => setHeaderVisible(!headerVisible)}
          sx={{ 
            width: 36,
            height: 20,
            borderRadius: '20px',
            minHeight: 'auto',
            '& .MuiSvgIcon-root': {
              fontSize: 16,
            }
          }}
        >
          {headerVisible ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </Fab>
      </Box>

      {/* Minimal floating controls when header is hidden */}
      {!headerVisible && (
        <Box sx={{ 
          position: 'fixed', 
          top: 8, 
          left: 8, 
          zIndex: 1100,
          display: 'flex',
          gap: 1,
          alignItems: 'center',
        }}>
          {/* Compact File Menu Button */}
          <Fab
            size="small"
            color="primary"
            onClick={handleMenuOpen}
            sx={{ width: 40, height: 40 }}
          >
            <MenuIcon />
          </Fab>
          
          {/* Current file indicator */}
          {currentFile && (
            <Box sx={{ 
              bgcolor: 'background.paper', 
              px: 2, 
              py: 0.5, 
              borderRadius: 20,
              boxShadow: 1,
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {(() => {
                  const findFileTitle = (node: FileTreeNode, path: string): string | null => {
                    if (node.type === 'file' && node.path === path) {
                      return node.title || node.name.replace(/\.md$/, '').replace(/[-_]/g, ' ');
                    }
                    if (node.children) {
                      for (const child of node.children) {
                        const title = findFileTitle(child, path);
                        if (title) return title;
                      }
                    }
                    return null;
                  };
                  const title = files ? findFileTitle(files, currentFile) || currentFile : currentFile;
                  return title.length > 30 ? title.substring(0, 30) + '...' : title;
                })()}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* File Menu Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            maxHeight: '80vh',
            width: 350,
            mt: 1,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[4],
          '& .MuiMenuItem-root': {
            color: '#000000',
          },
          },
        }}
      >
        <MenuItem disabled sx={{ borderBottom: `1px solid ${theme.palette.divider}`, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Select a file:
          </Typography>
        </MenuItem>
        {files && renderFileMenu(files)}
        {!files && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Loading files...
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.default',
          pt: headerVisible ? 0 : 6, // Add padding when header is hidden
        }}
      >
        {/* Content Container with Presentation Styling */}
        <Box
          sx={{
            flexGrow: 1,
            mx: 'auto',
            width: '100%',
            maxWidth: 1400,
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 1, sm: 1.5, md: 2 },
            // Presentation-style typography
            '& *': {
              lineHeight: 1.6,
            },
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Minimal Footer - Also hide when header is hidden */}
      <Collapse in={headerVisible}>
        <Box
          component="footer"
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'background.paper',
            px: { xs: 2, sm: 4 },
            py: 1,
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {/* Quick Navigation */}
            {showSectionControls && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {sections.slice(0, 7).map((section, index) => (
                  <Button
                    key={section}
                    size="small"
                    variant={currentSection === section ? 'contained' : 'text'}
                    onClick={() => {
                      if (onSectionSelect) {
                        onSectionSelect(section);
                      }
                    }}
                    sx={{ 
                      minWidth: 'auto',
                      px: 1,
                      py: 0.5,
                      fontSize: '0.75rem',
                    }}
                  >
                    {index + 1}
                  </Button>
                ))}
              </Box>
            )}

            {/* Status */}
            <Typography variant="caption" color="text.secondary">
              Press F11 for fullscreen • H to toggle header
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default PresentationLayout;
