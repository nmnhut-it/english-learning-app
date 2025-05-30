import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import MenuIcon from '@mui/icons-material/Menu';

interface LayoutProps {
  children: React.ReactNode;
  onMenuClick?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" sx={{ 
        height: 56, // Compact height
        boxShadow: 1 // Minimal shadow
      }}>
        <Toolbar variant="dense"> {/* Use dense variant */}
          {isMobile && onMenuClick && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={onMenuClick}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <SchoolIcon sx={{ mr: 1.5, fontSize: '1.5rem' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: '1.1rem' }}>
            English Learning Platform
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ 
        flexGrow: 1, 
        p: { xs: 1, sm: 2 }, // Responsive padding
        height: 'calc(100vh - 56px)',
        overflow: 'hidden'
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
