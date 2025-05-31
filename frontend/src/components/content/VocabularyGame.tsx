import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { VocabularyItem, GameMode } from '../../types';

interface VocabularyGameProps {
  open: boolean;
  onClose: () => void;
  vocabularyItems: VocabularyItem[];
}

const gameModes: GameMode[] = [
  {
    id: 'ipa-to-word',
    name: 'IPA → Word',
    description: 'Match pronunciation to English word',
  },
  {
    id: 'meaning-to-word',
    name: 'Meaning → Word',
    description: 'Match Vietnamese meaning to English word',
  },
  {
    id: 'word-to-meaning',
    name: 'Word → Meaning',
    description: 'Match English word to Vietnamese meaning',
  },
];

const VocabularyGame: React.FC<VocabularyGameProps> = ({ open, onClose, vocabularyItems }) => {
  const [gameMode, setGameMode] = useState<GameMode['id']>('ipa-to-word');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [shuffledItems, setShuffledItems] = useState<VocabularyItem[]>([]);

  useEffect(() => {
    if (open && vocabularyItems.length > 0) {
      // Normalize and shuffle items when dialog opens
      const normalized = vocabularyItems.map((item: any) => ({
        ...item,
        word: item.word || item.english || '',
        english: item.english || item.word || '',
        meaning: item.meaning || item.vietnamese || '',
        vietnamese: item.vietnamese || item.meaning || ''
      }));
      const shuffled = [...normalized].sort(() => Math.random() - 0.5);
      setShuffledItems(shuffled);
      resetGame();
    }
  }, [open, vocabularyItems]);

  const resetGame = () => {
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
    setGameStarted(false);
  };

  const startGame = () => {
    setGameStarted(true);
    setCurrentIndex(0);
    setScore(0);
  };

  const getCurrentQuestion = () => {
    if (shuffledItems.length === 0 || currentIndex >= shuffledItems.length) return null;
    
    const item = shuffledItems[currentIndex];
    // Handle both old and new vocabulary formats
    const word = item.english || item.word || '';
    const meaning = item.vietnamese || item.meaning || '';
    
    switch (gameMode) {
      case 'ipa-to-word':
        return {
          question: item.pronunciation || 'No pronunciation available',
          answer: word,
          hint: 'Enter the English word',
        };
      case 'meaning-to-word':
        return {
          question: meaning,
          answer: word,
          hint: 'Enter the English word',
        };
      case 'word-to-meaning':
        return {
          question: word,
          answer: meaning,
          hint: 'Enter the Vietnamese meaning',
        };
      default:
        return null;
    }
  };

  const checkAnswer = () => {
    const question = getCurrentQuestion();
    if (!question) return;

    const correct = userAnswer.trim().toLowerCase() === question.answer.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < shuffledItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setShowResult(false);
      setIsCorrect(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showResult) {
        nextQuestion();
      } else {
        checkAnswer();
      }
    }
  };

  const question = getCurrentQuestion();
  const progress = (currentIndex / shuffledItems.length) * 100;
  const isGameComplete = currentIndex >= shuffledItems.length - 1 && showResult;

  // Filter out items without pronunciation for IPA mode
  const filteredItems = gameMode === 'ipa-to-word' 
    ? vocabularyItems.filter(item => item.pronunciation)
    : vocabularyItems;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Vocabulary Game</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!gameStarted ? (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Select Game Mode
            </Typography>
            <RadioGroup
              value={gameMode}
              onChange={(e) => setGameMode(e.target.value as GameMode['id'])}
            >
              {gameModes.map((mode) => (
                <FormControlLabel
                  key={mode.id}
                  value={mode.id}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="subtitle1">{mode.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {mode.description}
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />
              ))}
            </RadioGroup>
            {gameMode === 'ipa-to-word' && filteredItems.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No vocabulary items with pronunciation available for this mode.
              </Alert>
            )}
          </Box>
        ) : (
          <Box>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Question {currentIndex + 1} of {shuffledItems.length}
                </Typography>
                <Typography variant="body2" color="primary">
                  Score: {score}/{shuffledItems.length}
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress} />
            </Box>

            {!isGameComplete && question && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h5" align="center" sx={{ mb: 3 }}>
                    {question.question}
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label={question.hint}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={showResult}
                    autoFocus
                  />

                  {showResult && (
                    <Box sx={{ mt: 2 }}>
                      <Alert 
                        severity={isCorrect ? 'success' : 'error'}
                        icon={isCorrect ? <CheckCircleIcon /> : <CancelIcon />}
                      >
                        {isCorrect ? 'Correct!' : `Incorrect. The answer is: ${question.answer}`}
                      </Alert>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {isGameComplete && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  Game Complete! 🎉
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mb: 3 }}>
                  Final Score: {score}/{shuffledItems.length}
                </Typography>
                <Chip
                  label={`${Math.round((score / shuffledItems.length) * 100)}%`}
                  color={score / shuffledItems.length >= 0.8 ? 'success' : 'warning'}
                  size="large"
                />
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {gameStarted ? (
          <>
            <Button 
              startIcon={<RestartAltIcon />}
              onClick={resetGame}
            >
              New Game
            </Button>
            {!isGameComplete && (
              <>
                {!showResult ? (
                  <Button 
                    variant="contained" 
                    onClick={checkAnswer}
                    disabled={!userAnswer.trim()}
                  >
                    Check Answer
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    onClick={nextQuestion}
                  >
                    Next Question
                  </Button>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={startGame}
              disabled={filteredItems.length === 0}
            >
              Start Game
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VocabularyGame;
