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

const VocabularyPresentation: React.FC<VocabularyPresentationProps> = ({ section, fontSize = 20 }) => {
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
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: `${fontSize * 1.2}px`, display: 'flex', alignItems: 'center', gap: 1 }}>
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
          className="glass-card"
          sx={{
            p: { xs: 3, md: 4 },
            textAlign: 'center',
            minHeight: fontSize >= 20 ? 350 : 300,  // Adjusted height
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.7) !important',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
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
              <NavigateBeforeIcon sx={{ fontSize: fontSize * 1.5 }} />  {/* Reduced icon size */}
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
              <NavigateNextIcon sx={{ fontSize: fontSize * 1.5 }} />  {/* Reduced icon size */}
            </IconButton>
          </Box>

          {/* Vocabulary Display */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: `${fontSize * 1.5}px`,  // Reduced from 3.5x
                  fontWeight: 700,
                  color: '#000000',
                }}
              >
                {item.english}
              </Typography>
              <IconButton
                size="large"
                onClick={() => speak(item.english)}
                sx={{ ml: 2 }}
              >
                <VolumeUpIcon sx={{ fontSize: fontSize * 1.5 }} />  {/* Reduced icon size */}
              </IconButton>
            </Box>

            <Typography
              variant="h2"
              sx={{
              fontSize: `${fontSize}px`,  // Same as content
              color: 'rgba(0, 0, 0, 0.7)',
              }}
            >
              {item.partOfSpeech && `(${item.partOfSpeech})`}
            </Typography>

            <Fade in={showVietnamese} timeout={300}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: `${fontSize * 1.3}px`,  // Reduced from 3x
                  color: showVietnamese ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.3)',
                  fontWeight: 600,
                }}
              >
                {showVietnamese ? item.vietnamese : '???'}
              </Typography>
            </Fade>

            <Typography
              variant="h3"
              sx={{
              fontSize: `${fontSize * 1.1}px`,  // Reduced from 2.5x
              fontStyle: 'italic',
              color: 'rgba(0, 0, 0, 0.6)',
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
              color: 'rgba(0, 0, 0, 0.6)',
              fontSize: `${fontSize}px`  // Same as content
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
        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: `${fontSize * 1.2}px`, display: 'flex', alignItems: 'center', gap: 1 }}>
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
            className="vocab-item-glass"
            sx={{
              p: fontSize >= 20 ? 3 : 2.5,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderLeft: '5px solid',
              borderLeftColor: index % 2 === 0 ? 'primary.light' : 'primary.main',
              mb: 2,
              '&:hover': {
                transform: 'translateX(10px)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
                  fontSize: `${fontSize}px`,  // Same as content
                  color: 'rgba(0, 0, 0, 0.7)',
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
                  fontSize: `${fontSize * 1.3}px`,  // Reduced from 2.5x
                  fontWeight: 700,
                  color: '#000000',
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
                  fontSize: `${fontSize}px`,  // Same as content
                  color: 'rgba(0, 0, 0, 0.7)',
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
                    fontSize: `${fontSize * 1.2}px`,  // Reduced from 2.5x
                    color: showVietnamese ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.3)',
                    fontWeight: 600,
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
                  fontSize: `${fontSize}px`,  // Same as content
                  fontStyle: 'italic',
                  color: 'rgba(0, 0, 0, 0.6)',
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
                <VolumeUpIcon sx={{ fontSize: fontSize * 1.2 }} />  {/* Smaller icon */}
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
