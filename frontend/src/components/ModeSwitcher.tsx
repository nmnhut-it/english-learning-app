import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

interface ModeSwitcherProps {
  mode: 'teacher' | 'student';
  onChange: (mode: 'teacher' | 'student') => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, onChange }) => {
  const handleChange = (event: React.MouseEvent<HTMLElement>, newMode: 'teacher' | 'student' | null) => {
    if (newMode !== null) {
      onChange(newMode);
    }
  };

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 20, 
      left: 20, 
      zIndex: 1200,
      bgcolor: 'background.paper',
      borderRadius: 2,
      boxShadow: 2,
      p: 0.5
    }}>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleChange}
        size="small"
      >
        <ToggleButton value="teacher">
          <Tooltip title="Teacher Mode - Full presentation controls">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon />
              Teacher
            </Box>
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="student">
          <Tooltip title="Student Mode - Games and practice">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon />
              Student
            </Box>
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ModeSwitcher;
