import React from 'react';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            English Learning Platform
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth={false} sx={{ height: 'calc(100vh - 64px)', p: 0 }}>
        {children}
      </Container>
    </>
  );
};

export default Layout;
