import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Collapse,
  Grid,
  Chip,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { VocabularyItem } from '../../types';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import VocabularyGame from './VocabularyGame';

interface VocabularySectionProps {
  section: any;
}

const VocabularySection: React.FC<VocabularySectionProps> = ({ section }) => {
  const [expanded, setExpanded] = useState(true);
  const [gameOpen, setGameOpen] = useState(false);
  const { speak } = useTextToSpeech();

  const vocabItems = section.content.filter((item: any) => item.type === 'vocabulary');

  return (
    <>
      <Card sx={{ mb: 2, boxShadow: 1 }}>
        <CardContent sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          '&:last-child': { pb: 2 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" component="h3" sx={{ 
              fontWeight: 500,
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}>
              📚 {section.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SportsEsportsIcon />}
                onClick={() => setGameOpen(true)}
                disabled={vocabItems.length === 0}
              >
                Play Game
              </Button>
              <IconButton onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>
          
          <Collapse in={expanded}>
            <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ mt: 1 }}>
              {vocabItems.map((item: VocabularyItem, index: number) => {
                // Handle both old and new vocabulary formats
                const word = item.english || item.word || '';
                const meaning = item.vietnamese || item.meaning || '';
                
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                    <Card variant="outlined" sx={{ 
                      p: 1.5, 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.95rem', sm: '1rem' },
                          flex: 1
                        }}>
                          {item.number && `${item.number}. `}{word}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => speak(word)}
                          sx={{ p: 0.5 }}
                        >
                          <VolumeUpIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {item.partOfSpeech && (
                          <Chip
                            label={item.partOfSpeech}
                            size="small"
                            color="primary"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                          {meaning}
                        </Typography>
                      </Box>
                      {item.pronunciation && (
                        <Chip
                          label={`/${item.pronunciation}/`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem', height: 24, alignSelf: 'flex-start' }}
                        />
                      )}
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      <VocabularyGame
        open={gameOpen}
        onClose={() => setGameOpen(false)}
        vocabularyItems={vocabItems}
      />
    </>
  );
};

export default VocabularySection;
