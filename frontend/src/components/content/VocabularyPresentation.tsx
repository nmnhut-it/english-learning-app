import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Card,
  Button,
  Fade,
  keyframes,
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import TranslateIcon from '@mui/icons-material/Translate';
import { VocabularyItem } from '../../types';
import useTextToSpeech from '../../hooks/useTextToSpeech';

// Lightweight pulse animation for IPA
const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.7; }
`;

interface VocabularyPresentationProps {
  section: any;
  fontSize?: number;
  readAloudEnabled?: boolean;
}

const VocabularyPresentation: React.FC<VocabularyPresentationProps> = ({ 
  section, 
  fontSize = 28,
  readAloudEnabled = false 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAll, setShowAll] = useState(true); // Default to list view
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayShowVietnamese, setAutoPlayShowVietnamese] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const { speak } = useTextToSpeech();

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Function to speak Vietnamese
  const speakVietnamese = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;
    
    if (voicesLoaded) {
      const voices = window.speechSynthesis.getVoices();
      const vietnameseVoice = voices.find(voice => voice.lang.startsWith('vi'));
      if (vietnameseVoice) {
        utterance.voice = vietnameseVoice;
      }
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Normalize vocabulary items with numbering
  const vocabItems = (section.content?.filter((item: any) => item.type === 'vocabulary') || [])
    .map((item: any, index: number) => ({
      ...item,
      number: index + 1,
      word: item.word || item.english || '',
      english: item.english || item.word || '',
      meaning: item.meaning || item.vietnamese || '',
      vietnamese: item.vietnamese || item.meaning || ''
    }));

  // Auto-play functionality with Vietnamese toggle and reading
  useEffect(() => {
    if (autoPlay && !showAll && vocabItems.length > 0) {
      const currentItem = vocabItems[currentIndex];
      
      // Read English immediately
      if (currentItem) {
        speak(currentItem.english);
      }
      
      // Show and read Vietnamese after 2.5 seconds
      const vietnameseTimer = setTimeout(() => {
        setAutoPlayShowVietnamese(true);
        // Read Vietnamese meaning
        if (currentItem && currentItem.vietnamese) {
          speakVietnamese(currentItem.vietnamese);
        }
      }, 2500);

      // Move to next word after 5 seconds
      const nextTimer = setTimeout(() => {
        setAutoPlayShowVietnamese(false);
        if (currentIndex < vocabItems.length - 1) {
          handleNext();
        } else {
          setAutoPlay(false);
        }
      }, 5000);

      return () => {
        clearTimeout(vietnameseTimer);
        clearTimeout(nextTimer);
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
      };
    }
  }, [autoPlay, currentIndex, vocabItems.length, showAll, speak]);

  // Read aloud when changing words
  useEffect(() => {
    if (readAloudEnabled && !showAll && vocabItems[currentIndex]) {
      speak(vocabItems[currentIndex].english);
    }
  }, [currentIndex, readAloudEnabled, showAll, speak, vocabItems]);

  const handlePrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
    setAutoPlayShowVietnamese(false);
  };

  const handleNext = () => {
    setCurrentIndex(Math.min(vocabItems.length - 1, currentIndex + 1));
    setAutoPlayShowVietnamese(false);
  };

  // Touch handlers for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  // Mouse wheel support
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      handleNext();
    } else {
      handlePrevious();
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (showAll) return; // Only work in single item view
    
    switch(e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
      case ',':
      case 'PageUp':
        e.preventDefault();
        handlePrevious();
        break;
      case 'ArrowRight':
      case 'ArrowDown':
      case '.':
      case 'PageDown':
        e.preventDefault();
        handleNext();
        break;
      case ' ':
        e.preventDefault();
        if (vocabItems[currentIndex]) {
          speak(vocabItems[currentIndex].english);
        }
        break;
      case 'Enter':
        e.preventDefault();
        setShowVietnamese(!showVietnamese);
        break;
      case 'a':
      case 'A':
        setAutoPlay(!autoPlay);
        break;
      case 'Home':
        e.preventDefault();
        setCurrentIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setCurrentIndex(vocabItems.length - 1);
        break;
      // Number keys for direct access
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        e.preventDefault();
        const num = parseInt(e.key) - 1;
        if (num < vocabItems.length) {
          setCurrentIndex(num);
        }
        break;
      case '0':
        e.preventDefault();
        if (9 < vocabItems.length) {
          setCurrentIndex(9);
        }
        break;
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, vocabItems.length, speak, showVietnamese, showAll, autoPlay]);

  if (vocabItems.length === 0) return null;

  // Single item/Flashcard view
  if (!showAll) {
    const item = vocabItems[currentIndex];
    if (!item) return null;

    return (
      <Box sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: `${fontSize}px`, display: 'flex', alignItems: 'center', gap: 1 }}>
            📖 {section.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={autoPlay ? "contained" : "outlined"}
              size="small"
              onClick={() => setAutoPlay(!autoPlay)}
              startIcon={autoPlay ? <PauseIcon /> : <PlayArrowIcon />}
              sx={{ fontSize: `${fontSize * 0.6}px` }}
            >
              {autoPlay ? 'Pause' : 'Auto'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowVietnamese(!showVietnamese)}
              startIcon={showVietnamese ? <VisibilityIcon /> : <VisibilityOffIcon />}
              sx={{ fontSize: `${fontSize * 0.6}px` }}
            >
              Meaning
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => setShowAll(true)}
              sx={{ fontSize: `${fontSize * 0.6}px` }}
            >
              List View
            </Button>
          </Box>
        </Box>

        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            minHeight: 450,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            background: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            cursor: 'grab',
            userSelect: 'none',
            '&:active': {
              cursor: 'grabbing',
            },
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onWheel={handleWheel}
        >
          {/* Navigation */}
          <IconButton
            size="large"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            sx={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)' }}
          >
            <NavigateBeforeIcon sx={{ fontSize: fontSize * 1.5 }} />
          </IconButton>
          
          <IconButton
            size="large"
            onClick={handleNext}
            disabled={currentIndex === vocabItems.length - 1}
            sx={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)' }}
          >
            <NavigateNextIcon sx={{ fontSize: fontSize * 1.5 }} />
          </IconButton>

          {/* Vocabulary Display */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {/* Word number */}
            <Typography
              variant="h3"
              sx={{
                fontSize: `${fontSize}px`,
                color: 'primary.main',
                fontWeight: 700,
                position: 'absolute',
                top: 20,
                left: 30,
              }}
            >
              #{item.number}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="h1"
                className="vocabulary-word"
                sx={{
                  fontSize: `${fontSize * 2.2}px`,
                  fontWeight: 800,
                  color: 'primary.main',
                  letterSpacing: '0.02em',
                }}
              >
                {item.english}
              </Typography>
              <IconButton
                size="large"
                onClick={() => speak(item.english)}
                sx={{ 
                  bgcolor: 'primary.light',
                  '&:hover': { bgcolor: 'primary.main' },
                  color: 'white'
                }}
              >
                <VolumeUpIcon sx={{ fontSize: fontSize * 1.2 }} />
              </IconButton>
            </Box>

            {item.partOfSpeech && (
              <Typography
                variant="h2"
                sx={{
                  fontSize: `${fontSize}px`,
                  color: 'text.secondary',
                  fontStyle: 'italic',
                }}
              >
                ({item.partOfSpeech})
              </Typography>
            )}

            {item.pronunciation && (
              <Typography
                variant="h3"
                sx={{
                  fontSize: `${fontSize * 1.2}px`,
                  fontStyle: 'italic',
                  color: 'secondary.main',
                  fontWeight: 600,
                  animation: autoPlay ? `${pulseAnimation} 2s infinite` : 'none',
                }}
              >
                /{item.pronunciation}/
              </Typography>
            )}

            <Fade in={showVietnamese || autoPlayShowVietnamese} timeout={500}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: `${fontSize * 1.8}px`,
                    color: (showVietnamese || autoPlayShowVietnamese) ? 'text.primary' : 'transparent',
                    fontWeight: 600,
                    minHeight: `${fontSize * 2}px`,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {(showVietnamese || autoPlayShowVietnamese) ? item.vietnamese : '• • •'}
                </Typography>
                {(showVietnamese || autoPlayShowVietnamese) && item.vietnamese && (
                  <IconButton
                    size="medium"
                    onClick={() => speakVietnamese(item.vietnamese)}
                    sx={{ 
                      bgcolor: 'secondary.light',
                      '&:hover': { bgcolor: 'secondary.main' },
                      color: 'white'
                    }}
                  >
                    <TranslateIcon sx={{ fontSize: fontSize * 0.8 }} />
                  </IconButton>
                )}
              </Box>
            </Fade>
          </Box>

          {/* Mini Preview Strip */}
          <Box sx={{ 
            position: 'absolute',
            bottom: 80,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            px: 4,
          }}>
            {/* Previous word preview */}
            {currentIndex > 0 && (
              <Box 
                onClick={handlePrevious}
                sx={{ 
                  cursor: 'pointer',
                  opacity: 0.5,
                  transition: 'all 0.2s',
                  '&:hover': { opacity: 0.8 },
                  textAlign: 'right',
                  flex: 1,
                }}
              >
                <Typography sx={{ fontSize: `${fontSize * 0.6}px`, color: 'text.secondary' }}>
                  ← #{vocabItems[currentIndex - 1].number}. {vocabItems[currentIndex - 1].english}
                </Typography>
              </Box>
            )}
            
            {/* Current position */}
            <Box sx={{ 
              px: 3,
              py: 1,
              borderRadius: 20,
              bgcolor: 'primary.main',
              color: 'white',
              minWidth: 120,
              textAlign: 'center',
            }}>
              <Typography sx={{ fontSize: `${fontSize * 0.6}px`, fontWeight: 700 }}>
                {currentIndex + 1} / {vocabItems.length}
              </Typography>
            </Box>
            
            {/* Next word preview */}
            {currentIndex < vocabItems.length - 1 && (
              <Box 
                onClick={handleNext}
                sx={{ 
                  cursor: 'pointer',
                  opacity: 0.5,
                  transition: 'all 0.2s',
                  '&:hover': { opacity: 0.8 },
                  textAlign: 'left',
                  flex: 1,
                }}
              >
                <Typography sx={{ fontSize: `${fontSize * 0.6}px`, color: 'text.secondary' }}>
                  #{vocabItems[currentIndex + 1].number}. {vocabItems[currentIndex + 1].english} →
                </Typography>
              </Box>
            )}
          </Box>

          {/* Progress and Controls */}
          <Box sx={{ 
            position: 'absolute', 
            bottom: 20, 
            left: 0, 
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2
          }}>
            {autoPlay && (
              <Typography
                variant="body2"
                sx={{
                  color: 'primary.main',
                  fontSize: `${fontSize * 0.6}px`,
                  animation: 'pulse 1s infinite',
                }}
              >
                Auto-playing... {autoPlayShowVietnamese && <TranslateIcon sx={{ fontSize: fontSize * 0.6, ml: 1 }} />}
              </Typography>
            )}
          </Box>
        </Card>

        {/* Navigation Strip */}
        <Box sx={{ 
          mt: 2, 
          display: 'flex', 
          gap: 0.5, 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {vocabItems.map((_, idx) => (
            <Button
              key={idx}
              variant={idx === currentIndex ? "contained" : "outlined"}
              size="small"
              onClick={() => setCurrentIndex(idx)}
              sx={{ 
                minWidth: 40,
                height: 40,
                fontSize: `${fontSize * 0.5}px`,
                fontWeight: idx === currentIndex ? 700 : 400,
                p: 0,
              }}
            >
              {idx + 1}
            </Button>
          ))}
        </Box>

        {/* Teacher Tips */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ fontSize: `${fontSize * 0.5}px`, color: 'text.secondary', display: 'block', textAlign: 'center' }}>
            💡 Navigation: ←→↑↓ or ,. = Next/Prev • 1-9 = Jump to word • Space = Speak English • Enter = Show/Hide Meaning
          </Typography>
          <Typography variant="caption" sx={{ fontSize: `${fontSize * 0.5}px`, color: 'text.secondary', display: 'block', textAlign: 'center', mt: 0.5 }}>
            🔊 Auto-play: Reads English → waits 2.5s → shows & reads Vietnamese meaning → next word after 5s total
          </Typography>
        </Box>
      </Box>
    );
  }

  // List view (default) - notebook style
  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: `${fontSize}px`, display: 'flex', alignItems: 'center', gap: 1 }}>
          📖 {section.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowVietnamese(!showVietnamese)}
            startIcon={showVietnamese ? <VisibilityIcon /> : <VisibilityOffIcon />}
            sx={{ fontSize: `${fontSize * 0.6}px` }}
          >
            Meanings
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setShowAll(false)}
            sx={{ fontSize: `${fontSize * 0.6}px` }}
          >
            Flashcard View
          </Button>
        </Box>
      </Box>

      {/* Notebook-style vocabulary list */}
      <Box sx={{ 
        bgcolor: 'white',
        border: '1px solid',
        borderColor: 'grey.300',
        borderRadius: 1,
        p: 2,
      }}>
        {vocabItems.map((item: VocabularyItem, index: number) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 0.75,
              borderBottom: index < vocabItems.length - 1 ? '1px solid' : 'none',
              borderBottomColor: 'grey.200',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'grey.50',
                pl: 1,
              },
            }}
            onClick={() => speak(item.english)}
          >
            {/* Number */}
            <Typography
              sx={{
                fontSize: `${fontSize * 0.8}px`,
                fontWeight: 600,
                color: 'primary.main',
                minWidth: '35px',
                textAlign: 'right',
              }}
            >
              {item.number}.
            </Typography>
            
            {/* English word with part of speech */}
            <Box sx={{ minWidth: '30%' }}>
              <Typography
                component="span"
                sx={{
                  fontSize: `${fontSize}px`,
                  fontWeight: 700,
                  color: 'black',
                }}
              >
                {item.english}
              </Typography>
              {item.partOfSpeech && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: `${fontSize * 0.7}px`,
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    ml: 1,
                  }}
                >
                  ({item.partOfSpeech})
                </Typography>
              )}
            </Box>

            {/* IPA */}
            {item.pronunciation && (
              <Typography
                sx={{
                  fontSize: `${fontSize * 0.8}px`,
                  color: 'secondary.main',
                  fontStyle: 'italic',
                  minWidth: '20%',
                }}
              >
                /{item.pronunciation}/
              </Typography>
            )}
            
            {/* Vietnamese Meaning */}
            <Fade in={showVietnamese} timeout={300}>
              <Typography
                sx={{
                  fontSize: `${fontSize * 0.9}px`,
                  color: showVietnamese ? 'text.primary' : 'transparent',
                  flex: 1,
                }}
              >
                {showVietnamese ? item.vietnamese : '• • •'}
              </Typography>
            </Fade>
            
            {/* Audio Buttons */}
            <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
              {showVietnamese && item.vietnamese && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakVietnamese(item.vietnamese);
                  }}
                  sx={{
                    p: 0.5,
                    opacity: 0.7,
                    '&:hover': { 
                      opacity: 1,
                      bgcolor: 'secondary.light',
                    },
                  }}
                >
                  <TranslateIcon sx={{ fontSize: fontSize * 0.6 }} />
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  speak(item.english);
                }}
                sx={{
                  p: 0.5,
                  opacity: 0.7,
                  '&:hover': { 
                    opacity: 1,
                    bgcolor: 'primary.light',
                  },
                }}
              >
                <VolumeUpIcon sx={{ fontSize: fontSize * 0.7 }} />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default VocabularyPresentation;
