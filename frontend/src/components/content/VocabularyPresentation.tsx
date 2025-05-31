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
  fontSize?: number;
}

const VocabularyPresentation: React.FC<VocabularyPresentationProps> = ({ section, fontSize = 16 }) => {
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
  }, [currentIndex, vocabItems.length, speak]);

  if (vocabItems.length === 0) return null;

  // Single item view
  if (!showAll) {
    const item = vocabItems[currentIndex];
    if (!item) return null;

    return (
      <Box sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, fontSize: `${fontSize * 1.5}px`, display: 'flex', alignItems: 'center', gap: 1 }}>
            📖 {section.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowVietnamese(!showVietnamese)}
              startIcon={showVietnamese ? <VisibilityIcon /> : <VisibilityOffIcon />}
              sx={{ fontSize: `${fontSize * 0.75}px` }}
            >
              Vietnamese
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => setShowAll(true)}
              sx={{ fontSize: `${fontSize * 0.75}px` }}
            >
              Show All
            </Button>
          </Box>
        </Box>

        <Card
          sx={{
            p: { xs: 2, md: 3 },
            textAlign: 'center',
            minHeight: fontSize >= 20 ? 300 : 250,
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
              <NavigateBeforeIcon sx={{ fontSize: fontSize * 2.5 }} />
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
              <NavigateNextIcon sx={{ fontSize: fontSize * 2.5 }} />
            </IconButton>
          </Box>

          {/* Vocabulary Display */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: `${fontSize * 3}px`,
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
                <VolumeUpIcon sx={{ fontSize: fontSize * 2.5 }} />
              </IconButton>
            </Box>

            <Typography
              variant="h2"
              sx={{
                fontSize: `${fontSize * 1.5}px`,
                color: 'text.secondary',
              }}
            >
              {item.partOfSpeech && `(${item.partOfSpeech})`}
            </Typography>

            <Fade in={showVietnamese} timeout={300}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: `${fontSize * 2.5}px`,
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
                fontSize: `${fontSize * 2.25}px`,
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
              fontSize: `${fontSize}px`
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
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, fontSize: `${fontSize * 1.75}px`, display: 'flex', alignItems: 'center', gap: 1 }}>
          📖 {section.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowVietnamese(!showVietnamese)}
            startIcon={showVietnamese ? <VisibilityIcon /> : <VisibilityOffIcon />}
            sx={{ fontSize: `${fontSize * 0.75}px` }}
          >
            Vietnamese
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setShowAll(false)}
            sx={{ fontSize: `${fontSize * 0.75}px` }}
          >
            One by One
          </Button>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1,
        overflow: 'hidden',
        maxWidth: '100%'
      }}>
        {vocabItems.map((item: VocabularyItem, index: number) => (
          <Card
            key={index}
            sx={{
              p: fontSize >= 20 ? 2.5 : fontSize >= 16 ? 2 : 1.5,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: index % 2 === 0 ? 'background.paper' : 'grey.50',
              borderLeft: '4px solid',
              borderLeftColor: index % 2 === 0 ? 'primary.light' : 'primary.main',
              '&:hover': {
                transform: 'translateX(8px)',
                boxShadow: 3,
                backgroundColor: 'primary.50',
                borderLeftColor: 'primary.dark',
              },
            }}
            onClick={() => {
              setCurrentIndex(index);
              setShowAll(false);
            }}
          >
            {/* Desktop Layout */}
            <Box sx={{ 
              display: { xs: 'none', md: 'grid' }, 
              gridTemplateColumns: '50px minmax(150px, 0.7fr) 80px minmax(150px, 0.9fr) minmax(150px, 0.8fr) 50px',
              alignItems: 'center',
              gap: 2,
              width: '100%'
            }}>
              {/* Number */}
              <Typography
                variant="h4"
                sx={{
                  fontSize: `${fontSize * 1.25}px`,
                  color: 'text.secondary',
                  textAlign: 'right',
                  pr: 1
                }}
              >
                {index + 1}.
              </Typography>
              
              {/* English Word */}
              <Typography
                variant="h4"
                sx={{
                  fontSize: `${fontSize * 2}px`,
                  fontWeight: 600,
                  color: 'primary.main',
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                }}
              >
                {item.english}
              </Typography>
              
              {/* Part of Speech */}
              <Typography
                variant="h4"
                sx={{
                  fontSize: `${fontSize * 1.75}px`,
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                ({item.partOfSpeech})
              </Typography>
              
              {/* Vietnamese */}
              <Fade in={showVietnamese} timeout={300}>
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: `${fontSize * 2}px`,
                    color: 'secondary.main',
                    fontWeight: 500,
                    wordBreak: 'break-word',
                    hyphens: 'auto',
                  }}
                >
                  {showVietnamese ? item.vietnamese : '???'}
                </Typography>
              </Fade>
              
              {/* Pronunciation */}
              <Typography
                variant="h4"
                sx={{
                  fontSize: `${fontSize * 1.75}px`,
                  fontStyle: 'italic',
                  color: 'text.secondary',
                  wordBreak: 'break-word',
                }}
              >
                {item.pronunciation}
              </Typography>
              
              {/* Audio Button */}
              <IconButton
                size="large"
                onClick={(e) => {
                  e.stopPropagation();
                  speak(item.english);
                }}
              >
                <VolumeUpIcon sx={{ fontSize: fontSize * 1.75 }} />
              </IconButton>
            </Box>
            
            {/* Mobile/Tablet Layout */}
            <Box sx={{ 
              display: { xs: 'flex', md: 'none' },
              flexDirection: 'column',
              gap: 0.5,
              width: '100%'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                    color: 'text.secondary',
                  }}
                >
                  {index + 1}.
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    fontWeight: 600,
                    color: 'primary.main',
                  }}
                >
                  {item.english}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    color: 'text.secondary',
                  }}
                >
                  ({item.partOfSpeech})
                </Typography>
                <IconButton
                  size="medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(item.english);
                  }}
                  sx={{ ml: 'auto' }}
                >
                  <VolumeUpIcon sx={{ fontSize: 24 }} />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, pl: 5 }}>
                <Fade in={showVietnamese} timeout={300}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontSize: { xs: '1.75rem', sm: '2rem' },
                      color: 'secondary.main',
                      fontWeight: 500,
                    }}
                  >
                    {showVietnamese ? item.vietnamese : '???'}
                  </Typography>
                </Fade>
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                    fontStyle: 'italic',
                    color: 'text.secondary',
                  }}
                >
                  {item.pronunciation}
                </Typography>
              </Box>
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default VocabularyPresentation;
