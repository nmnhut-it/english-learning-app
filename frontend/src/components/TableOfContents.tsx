import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import CloseIcon from '@mui/icons-material/Close';
import { Heading } from '../types';

interface TableOfContentsProps {
  headings: Heading[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ headings }) => {
  const [collapsed, setCollapsed] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Hide on mobile
  if (isMobile) {
    return null;
  }

  return (
    <Paper
      elevation={1}
      sx={{
        position: 'sticky',
        top: 70,
        maxHeight: 'calc(100vh - 100px)',
        width: collapsed ? 50 : 250,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        borderRadius: 1,
        ml: 2,
      }}
    >
      <Box sx={{ 
        p: collapsed ? 1 : 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {!collapsed && (
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
            <ListIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            Contents
          </Typography>
        )}
        <IconButton 
          size="small" 
          onClick={() => setCollapsed(!collapsed)}
          sx={{ ml: collapsed ? 0 : 'auto' }}
        >
          {collapsed ? <ListIcon /> : <CloseIcon />}
        </IconButton>
      </Box>
      {!collapsed && (
        <Box sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 150px)' }}>
          <List dense>
            {headings.map((heading, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  onClick={() => handleClick(heading.id)}
                  sx={{ pl: heading.level * 1.5 }}
                >
                  <ListItemText
                    primary={heading.text}
                    primaryTypographyProps={{
                      fontSize: heading.level === 1 ? '0.875rem' : '0.8rem',
                      fontWeight: heading.level === 1 ? 500 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
};

export default TableOfContents;
