import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Collapse,
  Divider,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { DialogueItem } from '../../types';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import VocabularySection from './VocabularySection';

interface GettingStartedProps {
  section: any;
}

const GettingStarted: React.FC<GettingStartedProps> = ({ section }) => {
  const [expanded, setExpanded] = useState(true);
  const { speak } = useTextToSpeech();

  const dialogues = section.content.filter((item: any) => item.type === 'dialogue');
  const vocabSubsection = section.subsections?.find((sub: any) => sub.type === 'vocabulary');

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h4"
        component="h2"
        id={section.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}
        sx={{ mb: 3, fontWeight: 500 }}
      >
        {section.title}
      </Typography>

      {vocabSubsection && <VocabularySection section={vocabSubsection} />}

      {dialogues.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h5" component="h3" sx={{ fontWeight: 500 }}>
                💬 Dialogue
              </Typography>
              <IconButton onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={expanded}>
              <Box sx={{ mt: 2 }}>
                {dialogues.map((dialogue: DialogueItem, index: number) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: index % 2 === 0 ? 'grey.50' : 'grey.100',
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, minWidth: 80 }}
                      >
                        {dialogue.speaker}:
                      </Typography>
                      <Box sx={{ flex: 1, ml: 2 }}>
                        <Typography variant="body1">
                          {dialogue.text}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => speak(dialogue.text)}
                          sx={{ mt: 0.5 }}
                        >
                          <VolumeUpIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default GettingStarted;
