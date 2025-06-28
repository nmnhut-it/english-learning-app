import React, { useState, useEffect, useRef } from 'react';
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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(7);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const QUESTION_TIME = 7; // seconds
  const MAX_QUESTIONS = Math.min(vocabulary.length * 2, 20); // More questions with varied types

  // Reset timer when question changes
  useEffect(() => {
    if (gameState === 'playing' && !isAnswered) {
      setTimeLeft(QUESTION_TIME);
      
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [currentQuestion, gameState, isAnswered]);

  const handleTimeout = () => {
    setIsAnswered(true);
    setStreak(0);
    if (timerRef.current) clearInterval(timerRef.current);
    
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  // Enhanced question generator with multiple types
  const generateQuestion = (): Question | null => {
    if (!vocabulary || vocabulary.length === 0) return null;
    
    // Determine question type based on progress and performance
    const questionTypes = ['translation_en_vn', 'translation_vn_en'];
    
    // Add more complex types after warming up
    if (currentQuestion > 3) {
      questionTypes.push('missing_letters');
      if (currentQuestion > 6) {
        questionTypes.push('context');
      }
    }
    
    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)] as Question['type'];
    const wordIndex = currentQuestion % vocabulary.length;
    const currentWord = vocabulary[wordIndex];
    
    switch (type) {
      case 'translation_en_vn':
        return generateTranslationQuestion(currentWord, false);
      
      case 'translation_vn_en':
        return generateTranslationQuestion(currentWord, true);
      
      case 'missing_letters':
        return generateMissingLettersQuestion(currentWord);
      
      case 'context':
        return generateContextQuestion(currentWord);
      
      default:
        return generateTranslationQuestion(currentWord, false);
    }
  };

  const generateTranslationQuestion = (word: VocabularyItem, reverse: boolean): Question => {
    const question = reverse ? word.vietnamese : word.english;
    const correctAnswer = reverse ? word.english : word.vietnamese;
    
    // Get wrong answers
    const wrongAnswers = vocabulary
      .filter(v => (reverse ? v.english : v.vietnamese) !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(v => reverse ? v.english : v.vietnamese);
    
    const allAnswers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    
    return {
      question,
      correctAnswer,
      options: allAnswers,
      type: reverse ? 'translation_vn_en' : 'translation_en_vn',
      hint: word.partOfSpeech
    };
  };

  const generateMissingLettersQuestion = (word: VocabularyItem): Question => {
    const english = word.english;
    const vowels = 'aeiouAEIOU';
    
    // Remove vowels or some letters
    let maskedWord = '';
    for (let i = 0; i < english.length; i++) {
      if (vowels.includes(english[i]) && Math.random() > 0.3) {
        maskedWord += '_';
      } else {
        maskedWord += english[i];
      }
    }
    
    // Generate similar words as distractors
    const distractors = vocabulary
      .filter(v => v.english !== english && Math.abs(v.english.length - english.length) <= 2)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(v => v.english);
    
    const allAnswers = [english, ...distractors].sort(() => Math.random() - 0.5);
    
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
      // Add more contexts as needed
    };
    
    const defaultContext = `The word "${word.vietnamese}" means _____ in English.`;
    const context = contexts[word.english.toLowerCase()] || defaultContext;
    
    const wrongAnswers = vocabulary
      .filter(v => v.english !== word.english)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(v => v.english);
    
    const allAnswers = [word.english, ...wrongAnswers].sort(() => Math.random() - 0.5);
    
    return {
      question: context,
      correctAnswer: word.english,
      options: allAnswers,
      type: 'context',
      hint: word.partOfSpeech
    };
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    
    setIsAnswered(true);
    setSelectedAnswer(answer);
    if (timerRef.current) clearInterval(timerRef.current);
    
    const question = generateQuestion();
    if (!question) return;
    
    const isCorrect = answer === question.correctAnswer;
    
    if (isCorrect) {
      // Calculate score based on time left
      const timeBonus = Math.round((timeLeft / QUESTION_TIME) * 100);
      const baseScore = 100;
      setScore(score + baseScore + timeBonus);
      setCorrectAnswers(correctAnswers + 1);
      setStreak(streak + 1);
      if (streak + 1 > bestStreak) {
        setBestStreak(streak + 1);
      }
    } else {
      setStreak(0);
    }
    
    // Auto-advance after showing result
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const nextQuestion = () => {
    if (currentQuestion + 1 >= MAX_QUESTIONS) {
      setGameState('results');
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
    }
  };

  const startGame = () => {
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setCorrectAnswers(0);
    setStreak(0);
    setBestStreak(0);
    setIsAnswered(false);
    setSelectedAnswer(null);
  };

  const question = generateQuestion();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || !question || isAnswered) return;
      
      const keyMap: { [key: string]: number } = {
        'q': 0, 'w': 1, 'e': 2, 'r': 3,
        '1': 0, '2': 1, '3': 2, '4': 3
      };
      
      const index = keyMap[e.key.toLowerCase()];
      if (index !== undefined && index < question.options.length) {
        handleAnswer(question.options[index]);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, question, isAnswered]);

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
            {vocabulary.length} words • {MAX_QUESTIONS} questions • Multiple question types
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
      {gameState === 'playing' && question && (
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Question {currentQuestion + 1} of {MAX_QUESTIONS}
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
                question.type === 'missing_letters' ? 'Fill the gaps' :
                question.type === 'context' ? 'Context' :
                question.type === 'translation_vn_en' ? 'Vietnamese → English' :
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
                fontWeight: question.type === 'missing_letters' ? 'mono' : 'normal'
              }}
            >
              {question.question}
            </Typography>
            {question.hint && (
              <Typography variant="body2" color="text.secondary">
                Hint: {question.hint}
              </Typography>
            )}
          </Box>

          {/* Answer Options */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === question.correctAnswer;
              const showResult = isAnswered;
              
              return (
                <Button
                  key={index}
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
