import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Card,
  Button,
  Fade,
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { VocabularyItem } from '../../types';
import useTextToSpeech from '../../hooks/useTextToSpeech';

interface VocabularyPresentationProps {
  section: any;
}

const VocabularyPresentation: React.FC<VocabularyPresentationProps> = ({ section }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAll, setShowAll] = useState(true);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const { speak } = useTextToSpeech();

  // Normalize vocabulary items to ensure field compatibility
  const vocabItems = (section.content?.filter((item: any) => item.type === 'vocabulary') || [])
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

  const handlePrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex(Math.min(vocabItems.length - 1, currentIndex + 1));
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === ' ') {
      e.preventDefault();
      if (vocabItems[currentIndex]) {
        speak(vocabItems[currentIndex].english);
      }
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  if (vocabItems.length === 0) return null;

  // Single item view
  if (!showAll) {
    const item = vocabItems[currentIndex];
    if (!item) return null;

    return (
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {section.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowVietnamese(!showVietnamese)}
              startIcon={showVietnamese ? <VisibilityIcon /> : <VisibilityOffIcon />}
            >
              Vietnamese
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => setShowAll(true)}
            >
              Show All
            </Button>
          </Box>
        </Box>

        <Card
          sx={{
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            minHeight: 300,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Navigation */}
          <Box sx={{ 
            position: 'absolute', 
            left: 0, 
            top: '50%', 
            transform: 'translateY(-50%)',
          }}>
            <IconButton
              size="large"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              sx={{ ml: 2 }}
            >
              <NavigateBeforeIcon sx={{ fontSize: 40 }} />
            </IconButton>
          </Box>
          
          <Box sx={{ 
            position: 'absolute', 
            right: 0, 
            top: '50%', 
            transform: 'translateY(-50%)',
          }}>
            <IconButton
              size="large"
              onClick={handleNext}
              disabled={currentIndex === vocabItems.length - 1}
              sx={{ mr: 2 }}
            >
              <NavigateNextIcon sx={{ fontSize: 40 }} />
            </IconButton>
          </Box>

          {/* Vocabulary Display */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
                  fontWeight: 600,
                  color: 'primary.main',
                }}
              >
                {item.english}
              </Typography>
              <IconButton
                size="large"
                onClick={() => speak(item.english)}
                sx={{ ml: 2 }}
              >
                <VolumeUpIcon sx={{ fontSize: 40 }} />
              </IconButton>
            </Box>

            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                color: 'text.secondary',
              }}
            >
              {item.partOfSpeech && `(${item.partOfSpeech})`}
            </Typography>

            <Fade in={showVietnamese} timeout={300}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                  color: 'secondary.main',
                  fontWeight: 500,
                }}
              >
                {showVietnamese ? item.vietnamese : '???'}
              </Typography>
            </Fade>

            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                fontStyle: 'italic',
                color: 'text.secondary',
              }}
            >
              {item.pronunciation}
            </Typography>
          </Box>

          {/* Progress */}
          <Typography
            variant="body1"
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 24,
              color: 'text.secondary',
            }}
          >
            {currentIndex + 1} / {vocabItems.length}
          </Typography>
        </Card>
      </Box>
    );
  }

  // List view - single line format
  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {section.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowVietnamese(!showVietnamese)}
            startIcon={showVietnamese ? <VisibilityIcon /> : <VisibilityOffIcon />}
          >
            Vietnamese
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setShowAll(false)}
          >
            One by One
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {vocabItems.map((item: VocabularyItem, index: number) => (
          <Card
            key={index}
            sx={{
              p: 3,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateX(8px)',
                boxShadow: 2,
              },
            }}
            onClick={() => {
              setCurrentIndex(index);
              setShowAll(false);
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '32pt' },
                  fontWeight: 600,
                  color: 'primary.main',
                  minWidth: 300,
                }}
              >
                {item.english}
              </Typography>
              
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '28pt' },
                  color: 'text.secondary',
                }}
              >
                ({item.partOfSpeech})
              </Typography>
              
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '24pt' },
                  mx: 2,
                }}
              >
                -
              </Typography>
              
              <Fade in={showVietnamese} timeout={300}>
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '32pt' },
                    color: 'secondary.main',
                    fontWeight: 500,
                    flex: 1,
                  }}
                >
                  {showVietnamese ? item.vietnamese : '???'}
                </Typography>
              </Fade>
              
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '24pt' },
                  mx: 2,
                }}
              >
                -
              </Typography>
              
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '28pt' },
                  fontStyle: 'italic',
                  color: 'text.secondary',
                  minWidth: 200,
                }}
              >
                {item.pronunciation}
              </Typography>
              
              <IconButton
                size="large"
                onClick={(e) => {
                  e.stopPropagation();
                  speak(item.english);
                }}
                sx={{ ml: 2 }}
              >
                <VolumeUpIcon sx={{ fontSize: 32 }} />
              </IconButton>
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default VocabularyPresentation;
