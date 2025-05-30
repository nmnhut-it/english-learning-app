import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import { Heading } from '../types';

interface TableOfContentsProps {
  headings: Heading[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ headings }) => {
  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: 250,
        height: '100%',
        borderLeft: 1,
        borderColor: 'divider',
        overflow: 'auto',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <ListIcon sx={{ mr: 1 }} />
          Contents
        </Typography>
      </Box>
      <List dense>
        {headings.map((heading, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton
              onClick={() => handleClick(heading.id)}
              sx={{ pl: heading.level * 2 }}
            >
              <ListItemText
                primary={heading.text}
                primaryTypographyProps={{
                  fontSize: heading.level === 1 ? '0.95rem' : '0.85rem',
                  fontWeight: heading.level === 1 ? 500 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default TableOfContents;
