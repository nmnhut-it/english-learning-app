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
  Button,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import TranslateIcon from '@mui/icons-material/Translate';
import { DialogueItem } from '../../types';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import VocabularySection from './VocabularySection';
import ExerciseSection from './ExerciseSection';

interface GettingStartedProps {
  section: any;
}

const GettingStarted: React.FC<GettingStartedProps> = ({ section }) => {
  const [expanded, setExpanded] = useState(true);
  const [showTranslations, setShowTranslations] = useState(true);
  const { speak } = useTextToSpeech();
  
  console.log('\n=== GettingStarted Component ===');
  console.log('Section:', section);
  console.log('Subsections:', section.subsections);
  if (section.subsections) {
    section.subsections.forEach((sub: any, i: number) => {
      console.log(`  Subsection ${i}: type='${sub.type}', title='${sub.title}', content items=${sub.content?.length || 0}`);
    });
  }

  // Extract dialogues from both content and subsections
  const dialogues: DialogueItem[] = [];
  
  // From main content
  section.content?.forEach((item: any) => {
    if (item.type === 'dialogue') dialogues.push(item);
  });
  
  // From subsections  
  section.subsections?.forEach((sub: any) => {
    if (sub.type === 'content' && sub.content) {
      sub.content.forEach((item: any) => {
        if (item.type === 'dialogue') dialogues.push(item);
      });
    }
  });

  const vocabSubsection = section.subsections?.find((sub: any) => sub.type === 'vocabulary');
  const exercisesSubsection = section.subsections?.find((sub: any) => sub.type === 'exercises');
  
  console.log('Found vocabSubsection:', vocabSubsection);
  console.log('Found exercisesSubsection:', exercisesSubsection);

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
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={<TranslateIcon />}
                  onClick={() => setShowTranslations(!showTranslations)}
                  variant={showTranslations ? "contained" : "outlined"}
                >
                  {showTranslations ? 'Ẩn phiên dịch' : 'Hiện phiên dịch'}
                </Button>
                <IconButton onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Stack>
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">
                            {dialogue.text}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => speak(dialogue.text)}
                            sx={{ ml: 1 }}
                          >
                            <VolumeUpIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Collapse in={showTranslations && !!dialogue.translation}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ mt: 0.5, fontStyle: 'italic' }}
                          >
                            {dialogue.translation}
                          </Typography>
                        </Collapse>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}
      
      {exercisesSubsection && <ExerciseSection section={exercisesSubsection} />}
      
      {/* Render any other subsections as text content */}
      {section.subsections?.filter((sub: any) => 
        sub.type !== 'vocabulary' && 
        sub.type !== 'exercises' && 
        sub.type !== 'content'
      ).map((sub: any) => (
        <ExerciseSection key={sub.title} section={sub} />
      ))}
    </Box>
  );
};

export default GettingStarted;
