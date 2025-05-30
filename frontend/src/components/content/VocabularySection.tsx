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
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" component="h3" sx={{ fontWeight: 500 }}>
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
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {vocabItems.map((item: VocabularyItem, index: number) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                          {item.english}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => speak(item.english)}
                          sx={{ ml: 1 }}
                        >
                          <VolumeUpIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {item.vietnamese}
                        </Typography>
                        <Chip
                          label={item.pronunciation}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
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
