import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Paper,
  Typography,
  Box,
  Collapse,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ArticleIcon from '@mui/icons-material/Article';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { FileTreeNode } from '../types';

interface FileListProps {
  files: FileTreeNode | null;
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  open?: boolean;
  onToggle?: () => void;
}

interface TreeItemProps {
  node: FileTreeNode;
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  level: number;
}

const TreeItem: React.FC<TreeItemProps> = ({ node, selectedFile, onFileSelect, level }) => {
  const [open, setOpen] = useState(level === 0);

  if (node.type === 'file') {
    return (
      <ListItem disablePadding sx={{ pl: level * 2 }}>
        <ListItemButton
          selected={selectedFile === node.path}
          onClick={() => onFileSelect(node.path)}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <ArticleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={node.title || node.name}
            secondary={node.name}
            primaryTypographyProps={{
              fontWeight: selectedFile === node.path ? 600 : 400,
              fontSize: '0.9rem',
            }}
            secondaryTypographyProps={{
              fontSize: '0.75rem',
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  }

  return (
    <>
      <ListItem disablePadding sx={{ pl: level * 2 }}>
        <ListItemButton onClick={() => setOpen(!open)}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <IconButton size="small" edge="start">
              {open ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </IconButton>
            {open ? <FolderOpenIcon fontSize="small" /> : <FolderIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText
            primary={node.name}
            primaryTypographyProps={{
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          />
        </ListItemButton>
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List disablePadding>
          {node.children?.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              level={level + 1}
            />
          ))}
        </List>
      </Collapse>
    </>
  );
};

const FileList: React.FC<FileListProps> = ({ files, selectedFile, onFileSelect, open = true, onToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const drawerWidth = open ? 280 : 60;

  const content = (
    <>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontSize: open ? '1.25rem' : '0' }}>
          <FolderIcon sx={{ mr: open ? 1 : 0 }} />
          {open && (files?.name || 'Loading...')}
        </Typography>
      </Box>
      {files ? (
        <List>
          {files.children?.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              level={0}
            />
          ))}
        </List>
      ) : (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Loading files...
          </Typography>
        </Box>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: drawerWidth,
        height: '100%',
        borderRight: 1,
        borderColor: 'divider',
        overflow: 'auto',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      {content}
    </Paper>
  );
};

export default FileList;
