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

  console.log('\n=== VocabularySection Debug ===');
  console.log('Full section object:', JSON.stringify(section, null, 2).substring(0, 500) + '...');
  
  // Normalize vocabulary items to ensure field compatibility
  const vocabItems = section.content
    .filter((item: any) => item.type === 'vocabulary')
    .map((item: any) => {
      // Create a normalized item with both field naming conventions
      return {
        ...item,
        // Ensure both field names are available
        word: item.word || item.english || '',
        english: item.english || item.word || '',
        meaning: item.meaning || item.vietnamese || '',
        vietnamese: item.vietnamese || item.meaning || ''
      };
    });
  
  console.log('VocabularySection render:');
  console.log('  section:', section);
  console.log('  section.content:', section.content);
  console.log('  vocabItems after filter:', vocabItems);
  console.log('  vocabItems length:', vocabItems.length);

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
                // Debug logging (can be removed once working)
                if (index === 0) {
                  console.log('First normalized vocabulary item:', item);
                }
                
                // Use the normalized fields
                const word = item.word || '';
                const meaning = item.meaning || '';
                
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
                          flex: 1,
                          color: '#FF5722'
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
                            sx={{ 
                              fontSize: '0.85rem', 
                              height: 24,
                              backgroundColor: 'transparent',
                              color: '#000000',
                              fontWeight: 500,
                              fontStyle: 'italic',
                              border: '1px solid #000000',
                            }}
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
                          sx={{ 
                            fontSize: '0.8rem', 
                            height: 26, 
                            alignSelf: 'flex-start',
                            color: '#4CAF50',
                            borderColor: '#4CAF50',
                            fontWeight: 500,
                            fontStyle: 'italic',
                          }}
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
