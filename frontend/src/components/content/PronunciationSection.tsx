import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Collapse,
  Chip,
  Grid,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import useTextToSpeech from '../../hooks/useTextToSpeech';

interface PronunciationSectionProps {
  section: any;
}

const PronunciationSection: React.FC<PronunciationSectionProps> = ({ section }) => {
  const [expanded, setExpanded] = useState(true);
  const { speak } = useTextToSpeech();

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="h3" sx={{ fontWeight: 500 }}>
            🗣️ {section.title}
          </Typography>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {section.content.map((item: any, index: number) => {
              if (item.type === 'text') {
                return (
                  <Typography key={index} variant="body1" paragraph>
                    {item.value}
                  </Typography>
                );
              }
              return null;
            })}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default PronunciationSection;
