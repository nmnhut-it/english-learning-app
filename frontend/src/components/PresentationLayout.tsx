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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import { FileTreeNode } from '../types';

interface PresentationLayoutProps {
  children: React.ReactNode;
  files: FileTreeNode | null;
  currentFile: string | null;
  onFileSelect: (path: string) => void;
  currentSection?: string;
  sections?: string[];
  onSectionChange?: (direction: 'prev' | 'next') => void;
}

const PresentationLayout: React.FC<PresentationLayoutProps> = ({
  children,
  files,
  currentFile,
  onFileSelect,
  currentSection,
  sections = [],
  onSectionChange,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      backgroundColor: 'background.default',
    }}>
      {/* Minimal Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
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
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          
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
              <Typography color="text.primary" sx={{ fontSize: '0.9rem' }}>
                {currentFile.replace(/\.md$/, '').replace(/[-_]/g, ' ')}
              </Typography>
            )}
            {currentSection && (
              <Typography color="primary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {currentSection}
              </Typography>
            )}
          </Breadcrumbs>

          {/* Section Navigation */}
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
        </Toolbar>
      </AppBar>

      {/* File Menu Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            maxHeight: '80vh',
            width: 300,
            mt: 1,
          },
        }}
      >
        {files && renderFileMenu(files)}
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
        }}
      >
        {/* Content Container with Presentation Styling */}
        <Box
          sx={{
            flexGrow: 1,
            mx: 'auto',
            width: '100%',
            maxWidth: 1400,
            px: { xs: 2, sm: 4, md: 6 },
            py: { xs: 2, sm: 3, md: 4 },
            // Presentation-style typography
            '& *': {
              lineHeight: 1.6,
            },
            '& p, & li': {
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              mb: 2,
            },
            '& h1': {
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
              fontWeight: 600,
              mb: 4,
            },
            '& h2': {
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 600,
              mb: 3,
              mt: 4,
            },
            '& h3': {
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              fontWeight: 500,
              mb: 2,
              mt: 3,
            },
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Minimal Footer */}
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            {sections.slice(0, 7).map((section, index) => (
              <Button
                key={section}
                size="small"
                variant={currentSection === section ? 'contained' : 'text'}
                onClick={() => {
                  const element = document.getElementById(
                    section.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                  );
                  element?.scrollIntoView({ behavior: 'smooth' });
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

          {/* Status */}
          <Typography variant="caption" color="text.secondary">
            Press F11 for fullscreen
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PresentationLayout;
