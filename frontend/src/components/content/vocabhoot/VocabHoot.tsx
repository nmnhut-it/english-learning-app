import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Button, Typography, Paper, LinearProgress, Chip } from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import CloseIcon from '@mui/icons-material/Close';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface VocabularyItem {
  english: string;
  vietnamese: string;
  partOfSpeech?: string;
  pronunciation?: string;
}

interface Question {
  question: string;
  correctAnswer: string;
  options: string[];
  type: 'translation_en_vn' | 'translation_vn_en' | 'missing_letters' | 'context';
  hint?: string;
}

interface VocabHootProps {
  vocabulary: VocabularyItem[];
  onClose: () => void;
  sectionTitle?: string;
}

const VocabHoot: React.FC<VocabHootProps> = ({ vocabulary, onClose, sectionTitle }) => {
  const [gameState, setGameState] = useState<'welcome' | 'playing' | 'results'>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(7);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [usedWords, setUsedWords] = useState<Set<number>>(new Set());
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const QUESTION_TIME = 7; // seconds
  const TRANSITION_TIME = 2000; // milliseconds
  const MAX_QUESTIONS = Math.min(vocabulary.length * 2, 20);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Generate question when index changes
  useEffect(() => {
    if (gameState === 'playing' && !isAnswered) {
      generateNewQuestion();
    }
  }, [currentQuestionIndex, gameState]);

  // Timer management
  useEffect(() => {
    if (gameState === 'playing' && !isAnswered && currentQuestion) {
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Reset time
      setTimeLeft(QUESTION_TIME);
      
      // Start new timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Cleanup
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else {
      // Clear timer if answered or not playing
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [gameState, isAnswered, currentQuestion]);

  const handleTimeout = useCallback(() => {
    if (!isAnswered) {
      setIsAnswered(true);
      setStreak(0);
      
      // Clear the interval timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Advance after delay
      transitionTimerRef.current = setTimeout(() => {
        moveToNextQuestion();
      }, TRANSITION_TIME);
    }
  }, [isAnswered]);

  const generateNewQuestion = () => {
    if (!vocabulary || vocabulary.length === 0) return;
    
    // Get a random word that hasn't been used too much
    let wordIndex: number;
    let attempts = 0;
    
    do {
      wordIndex = Math.floor(Math.random() * vocabulary.length);
      attempts++;
    } while (usedWords.has(wordIndex) && attempts < 10 && usedWords.size < vocabulary.length);
    
    // If all words have been used, reset
    if (usedWords.size >= vocabulary.length) {
      setUsedWords(new Set());
    } else {
      setUsedWords(prev => new Set(prev).add(wordIndex));
    }
    
    const word = vocabulary[wordIndex];
    
    // Determine question type based on progress
    const questionTypes = ['translation_en_vn', 'translation_vn_en'];
    
    if (currentQuestionIndex > 3 && word.english.length > 3) {
      questionTypes.push('missing_letters');
    }
    if (currentQuestionIndex > 6) {
      questionTypes.push('context');
    }
    
    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)] as Question['type'];
    
    let question: Question;
    
    switch (type) {
      case 'translation_en_vn':
        question = generateTranslationQuestion(word, false);
        break;
      case 'translation_vn_en':
        question = generateTranslationQuestion(word, true);
        break;
      case 'missing_letters':
        question = generateMissingLettersQuestion(word);
        break;
      case 'context':
        question = generateContextQuestion(word);
        break;
      default:
        question = generateTranslationQuestion(word, false);
    }
    
    setCurrentQuestion(question);
  };

  const generateTranslationQuestion = (word: VocabularyItem, reverse: boolean): Question => {
    const question = reverse ? word.vietnamese : word.english;
    const correctAnswer = reverse ? word.english : word.vietnamese;
    
    // Get wrong answers - make sure they're unique
    const wrongAnswers = vocabulary
      .filter(v => {
        const answer = reverse ? v.english : v.vietnamese;
        return answer !== correctAnswer;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(v => reverse ? v.english : v.vietnamese);
    
    // Ensure we have 4 unique options
    const uniqueAnswers = Array.from(new Set([correctAnswer, ...wrongAnswers])).slice(0, 4);
    
    // If we don't have enough unique answers, add some dummy ones
    while (uniqueAnswers.length < 4) {
      uniqueAnswers.push(`Option ${uniqueAnswers.length + 1}`);
    }
    
    // Shuffle the answers
    const shuffledAnswers = uniqueAnswers.sort(() => Math.random() - 0.5);
    
    return {
      question,
      correctAnswer,
      options: shuffledAnswers,
      type: reverse ? 'translation_vn_en' : 'translation_en_vn',
      hint: word.partOfSpeech
    };
  };

  const generateMissingLettersQuestion = (word: VocabularyItem): Question => {
    const english = word.english;
    const vowels = 'aeiouAEIOU';
    
    // Remove some vowels
    let maskedWord = '';
    let removedCount = 0;
    
    for (let i = 0; i < english.length; i++) {
      if (vowels.includes(english[i]) && removedCount < 2 && Math.random() > 0.3) {
        maskedWord += '_';
        removedCount++;
      } else {
        maskedWord += english[i];
      }
    }
    
    // If no vowels were removed, remove at least one
    if (removedCount === 0) {
      for (let i = 0; i < english.length; i++) {
        if (vowels.includes(english[i])) {
          maskedWord = maskedWord.substring(0, i) + '_' + maskedWord.substring(i + 1);
          break;
        }
      }
    }
    
    // Generate similar words as distractors
    const distractors = vocabulary
      .filter(v => v.english !== english && Math.abs(v.english.length - english.length) <= 2)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(v => v.english);
    
    // Add dummy options if needed
    while (distractors.length < 3) {
      distractors.push(`${english.substring(0, 2)}${Math.random().toString(36).substring(2, 5)}`);
    }
    
    const allAnswers = [english, ...distractors].slice(0, 4).sort(() => Math.random() - 0.5);
    
    return {
      question: `${maskedWord}\n(${word.vietnamese})`,
      correctAnswer: english,
      options: allAnswers,
      type: 'missing_letters',
      hint: `${english.length} letters`
    };
  };

  const generateContextQuestion = (word: VocabularyItem): Question => {
    // Simple context sentences
    const contexts: { [key: string]: string } = {
      'happy': 'She felt very _____ when she got the good news.',
      'sad': 'The movie made everyone feel _____.',
      'big': 'The elephant is a very _____ animal.',
      'small': 'The mouse is a _____ creature.',
      'run': 'I like to _____ in the park every morning.',
      'walk': 'Let\'s _____ to the store instead of driving.',
      'eat': 'It\'s time to _____ lunch.',
      'drink': 'I need to _____ some water.',
      'read': 'I like to _____ books before bed.',
      'write': 'Please _____ your name on the paper.'
    };
    
    const defaultContext = `The word "${word.vietnamese}" means _____ in English.`;
    const context = contexts[word.english.toLowerCase()] || defaultContext;
    
    const wrongAnswers = vocabulary
      .filter(v => v.english !== word.english)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(v => v.english);
    
    const allAnswers = [word.english, ...wrongAnswers].slice(0, 4).sort(() => Math.random() - 0.5);
    
    return {
      question: context,
      correctAnswer: word.english,
      options: allAnswers,
      type: 'context',
      hint: word.partOfSpeech
    };
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered || !currentQuestion) return;
    
    // Mark as answered immediately to prevent double-clicks
    setIsAnswered(true);
    setSelectedAnswer(answer);
    
    // Clear the countdown timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      // Calculate score based on time left
      const timeBonus = Math.round((timeLeft / QUESTION_TIME) * 100);
      const baseScore = 100;
      setScore(prev => prev + baseScore + timeBonus);
      setCorrectAnswers(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        setBestStreak(current => Math.max(current, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }
    
    // Move to next question after delay
    transitionTimerRef.current = setTimeout(() => {
      moveToNextQuestion();
    }, TRANSITION_TIME);
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex + 1 >= MAX_QUESTIONS) {
      setGameState('results');
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
      setTimeLeft(QUESTION_TIME);
    }
  };

  const startGame = () => {
    // Reset all game state
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setStreak(0);
    setBestStreak(0);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setUsedWords(new Set());
    setTimeLeft(QUESTION_TIME);
    setCurrentQuestion(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || !currentQuestion || isAnswered) return;
      
      const keyMap: { [key: string]: number } = {
        'q': 0, 'w': 1, 'e': 2, 'r': 3,
        '1': 0, '2': 1, '3': 2, '4': 3
      };
      
      const index = keyMap[e.key.toLowerCase()];
      if (index !== undefined && index < currentQuestion.options.length) {
        handleAnswer(currentQuestion.options[index]);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, currentQuestion, isAnswered]);

  return (
    <Paper 
      elevation={3}
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: 900,
        maxHeight: '90vh',
        overflow: 'auto',
        p: 4,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        zIndex: 1300
      }}
    >
      {/* Close button */}
      <Button
        onClick={onClose}
        sx={{ position: 'absolute', top: 8, right: 8 }}
        startIcon={<CloseIcon />}
      >
        Close
      </Button>

      {/* Welcome Screen */}
      {gameState === 'welcome' && (
        <Box textAlign="center">
          <SportsEsportsIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" gutterBottom>
            VocabHoot!
          </Typography>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Test your vocabulary from: {sectionTitle || 'Current Section'}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {vocabulary.length} words • {MAX_QUESTIONS} questions • {QUESTION_TIME}s per question
          </Typography>
          <Box sx={{ mb: 3, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip label="Translations" color="primary" />
            <Chip label="Fill the gaps" color="secondary" />
            <Chip label="Context clues" color="success" />
          </Box>
          <Button 
            variant="contained" 
            size="large" 
            onClick={startGame}
            sx={{ px: 4, py: 2 }}
          >
            Start Game
          </Button>
        </Box>
      )}

      {/* Playing Screen */}
      {gameState === 'playing' && currentQuestion && (
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Question {currentQuestionIndex + 1} of {MAX_QUESTIONS}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {streak > 0 && (
                <Chip 
                  label={`🔥 Streak: ${streak}`} 
                  color="warning"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
              <Typography variant="h6">
                Score: {score}
              </Typography>
            </Box>
          </Box>

          {/* Timer */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TimerIcon />
              <Typography>{timeLeft}s</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(timeLeft / QUESTION_TIME) * 100}
              sx={{ height: 8, borderRadius: 4 }}
              color={timeLeft <= 2 ? 'error' : 'primary'}
            />
          </Box>

          {/* Question */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Chip 
              label={
                currentQuestion.type === 'missing_letters' ? 'Fill the gaps' :
                currentQuestion.type === 'context' ? 'Context' :
                currentQuestion.type === 'translation_vn_en' ? 'Vietnamese → English' :
                'English → Vietnamese'
              }
              sx={{ mb: 2 }}
              color="secondary"
              size="small"
            />
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 1,
                whiteSpace: 'pre-line',
                fontFamily: currentQuestion.type === 'missing_letters' ? 'monospace' : 'inherit'
              }}
            >
              {currentQuestion.question}
            </Typography>
            {currentQuestion.hint && (
              <Typography variant="body2" color="text.secondary">
                Hint: {currentQuestion.hint}
              </Typography>
            )}
          </Box>

          {/* Answer Options */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              const showResult = isAnswered;
              
              return (
                <Button
                  key={`${currentQuestionIndex}-${index}`}
                  variant="contained"
                  size="large"
                  onClick={() => handleAnswer(option)}
                  disabled={isAnswered}
                  sx={{
                    py: 3,
                    fontSize: '1.2rem',
                    position: 'relative',
                    backgroundColor: 
                      showResult && isCorrect ? '#4CAF50' :
                      showResult && isSelected && !isCorrect ? '#f44336' :
                      ['#e21b3c', '#1368ce', '#d89e00', '#9c27b0'][index],
                    '&:hover': {
                      backgroundColor: 
                        showResult && isCorrect ? '#4CAF50' :
                        showResult && isSelected && !isCorrect ? '#f44336' :
                        ['#c51833', '#1059b3', '#b88400', '#8921a0'][index],
                    },
                    '&:disabled': {
                      backgroundColor: 
                        showResult && isCorrect ? '#4CAF50' :
                        showResult && isSelected && !isCorrect ? '#f44336' :
                        ['#e21b3c', '#1368ce', '#d89e00', '#9c27b0'][index],
                      opacity: showResult && !isCorrect && !isSelected ? 0.5 : 1,
                    }
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                    <Chip 
                      label={['Q', 'W', 'E', 'R'][index]} 
                      size="small"
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  {option}
                  {showResult && isCorrect && (
                    <CheckCircleIcon sx={{ ml: 1 }} />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <CancelIcon sx={{ ml: 1 }} />
                  )}
                </Button>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Results Screen */}
      {gameState === 'results' && (
        <Box textAlign="center">
          <Typography variant="h3" gutterBottom>
            Game Over!
          </Typography>
          <Typography variant="h4" sx={{ mb: 2, color: 'primary.main' }}>
            Final Score: {score}
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">
              Correct Answers: {correctAnswers} / {MAX_QUESTIONS}
            </Typography>
            <Typography variant="h6">
              Accuracy: {Math.round((correctAnswers / MAX_QUESTIONS) * 100)}%
            </Typography>
            <Typography variant="h6">
              Best Streak: 🔥 {bestStreak}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" onClick={startGame}>
              Play Again
            </Button>
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default VocabHoot;
