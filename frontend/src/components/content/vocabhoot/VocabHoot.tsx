import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  LinearProgress, 
  Chip,
  IconButton,
  Fade,
  Zoom,
  Grow,
  keyframes
} from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import CloseIcon from '@mui/icons-material/Close';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GameSounds from './GameSounds';

// Animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-20px); }
  60% { transform: translateY(-10px); }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 208, 132, 0.5); }
  50% { box-shadow: 0 0 20px rgba(0, 208, 132, 0.8), 0 0 30px rgba(0, 208, 132, 0.6); }
  100% { box-shadow: 0 0 5px rgba(0, 208, 132, 0.5); }
`;

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCorrectAnimation, setShowCorrectAnimation] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameSounds = useRef(new GameSounds());

  const QUESTION_TIME = 7; // seconds
  const TRANSITION_TIME = 2500; // milliseconds (increased for animations)
  const MAX_QUESTIONS = Math.min(vocabulary.length * 2, 20);

  // Initialize sound
  useEffect(() => {
    gameSounds.current.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      gameSounds.current.stopAll();
    };
  }, []);

  // Generate question when index changes
  useEffect(() => {
    if (gameState === 'playing' && !isAnswered) {
      generateNewQuestion();
      gameSounds.current.play('tink');
    }
  }, [currentQuestionIndex, gameState]);

  // Timer management with tick sounds
  useEffect(() => {
    if (gameState === 'playing' && !isAnswered && currentQuestion) {
      // Clear any existing timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);

      // Reset time
      setTimeLeft(QUESTION_TIME);
      
      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          
          // Play warning sound when time is running out
          if (prev === 3) {
            gameSounds.current.play('timeWarning');
          }
          
          return prev - 1;
        });
      }, 1000);

      // Start tick sound timer (every second)
      tickTimerRef.current = setInterval(() => {
        gameSounds.current.play('tick');
      }, 1000);

      // Cleanup
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      };
    } else {
      // Clear timers if answered or not playing
      if (timerRef.current) clearInterval(timerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    }
  }, [gameState, isAnswered, currentQuestion]);

  const handleTimeout = useCallback(() => {
    if (!isAnswered) {
      setIsAnswered(true);
      setStreak(0);
      gameSounds.current.play('wrong');
      
      // Clear the timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      
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
    
    // Clear the timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      // Play correct sound
      gameSounds.current.play('correct');
      setShowCorrectAnimation(true);
      
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
      // Play wrong sound
      gameSounds.current.play('wrong');
      setStreak(0);
    }
    
    // Move to next question after delay
    transitionTimerRef.current = setTimeout(() => {
      setShowCorrectAnimation(false);
      moveToNextQuestion();
    }, TRANSITION_TIME);
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex + 1 >= MAX_QUESTIONS) {
      gameSounds.current.play('gameOver');
      setGameState('results');
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
      setTimeLeft(QUESTION_TIME);
    }
  };

  const startGame = () => {
    // Play start sound
    gameSounds.current.play('gameStart');
    
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
      elevation={8}
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '95%',
        maxWidth: 1000,
        maxHeight: '95vh',
        overflow: 'auto',
        p: 4,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
        zIndex: 1300
      }}
    >
      {/* Header Bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        borderBottom: '2px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          VocabHoot
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </IconButton>
          <Button
            onClick={onClose}
            startIcon={<CloseIcon />}
            variant="outlined"
            color="error"
          >
            Exit
          </Button>
        </Box>
      </Box>

      {/* Welcome Screen */}
      {gameState === 'welcome' && (
        <Fade in timeout={500}>
          <Box textAlign="center" sx={{ py: 4 }}>
            <Zoom in timeout={700}>
              <SportsEsportsIcon sx={{ fontSize: 120, color: 'primary.main', mb: 3 }} />
            </Zoom>
            <Typography 
              variant="h2" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #00D084 30%, #10B981 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3
              }}
            >
              VocabHoot!
            </Typography>
            <Typography variant="h5" sx={{ mb: 3, color: 'text.secondary' }}>
              {sectionTitle || 'Vocabulary Challenge'}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 4, 
              mb: 4,
              flexWrap: 'wrap'
            }}>
              <Box textAlign="center">
                <Typography variant="h3" color="primary">{vocabulary.length}</Typography>
                <Typography variant="body1">Words</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h3" color="secondary">{MAX_QUESTIONS}</Typography>
                <Typography variant="body1">Questions</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h3" color="warning.main">{QUESTION_TIME}s</Typography>
                <Typography variant="body1">Per Question</Typography>
              </Box>
            </Box>
            <Box sx={{ mb: 4, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip label="🌐 Translations" color="primary" sx={{ fontSize: '1rem' }} />
              <Chip label="✏️ Fill the Gaps" color="secondary" sx={{ fontSize: '1rem' }} />
              <Chip label="💭 Context Clues" color="success" sx={{ fontSize: '1rem' }} />
            </Box>
            <Button 
              variant="contained" 
              size="large" 
              onClick={startGame}
              sx={{ 
                px: 6, 
                py: 2,
                fontSize: '1.5rem',
                borderRadius: 3,
                background: 'linear-gradient(45deg, #00D084 30%, #10B981 90%)',
                boxShadow: '0 3px 15px 2px rgba(0, 208, 132, .3)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 5px 20px 2px rgba(0, 208, 132, .4)',
                }
              }}
            >
              Start Game
            </Button>
          </Box>
        </Fade>
      )}

      {/* Playing Screen */}
      {gameState === 'playing' && currentQuestion && (
        <Box>
          {/* Game Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 2
          }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Question {currentQuestionIndex + 1} / {MAX_QUESTIONS}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {streak >= 3 && (
                <Grow in>
                  <Chip 
                    label={`🔥 Streak: ${streak}`} 
                    color="warning"
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      animation: `${bounce} 0.5s ease-in-out`
                    }}
                  />
                </Grow>
              )}
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main',
                  animation: score > 0 ? `${pulse} 0.5s ease-in-out` : 'none'
                }}
              >
                Score: {score}
              </Typography>
            </Box>
          </Box>

          {/* Timer */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TimerIcon sx={{ 
                color: timeLeft <= 3 ? 'error.main' : 'text.secondary',
                animation: timeLeft <= 3 ? `${shake} 0.5s ease-in-out infinite` : 'none'
              }} />
              <Typography 
                variant="h6"
                sx={{ 
                  fontWeight: 'bold',
                  color: timeLeft <= 3 ? 'error.main' : 'text.primary'
                }}
              >
                {timeLeft}s
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(timeLeft / QUESTION_TIME) * 100}
              sx={{ 
                height: 12, 
                borderRadius: 6,
                bgcolor: 'grey.300',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6,
                  background: timeLeft <= 3 
                    ? 'linear-gradient(45deg, #f44336 30%, #ff6659 90%)'
                    : 'linear-gradient(45deg, #00D084 30%, #10B981 90%)',
                }
              }}
            />
          </Box>

          {/* Question */}
          <Fade in timeout={300}>
            <Box sx={{ mb: 5, textAlign: 'center' }}>
              <Chip 
                label={
                  currentQuestion.type === 'missing_letters' ? '✏️ Fill the Gaps' :
                  currentQuestion.type === 'context' ? '💭 Context Clue' :
                  currentQuestion.type === 'translation_vn_en' ? '🇻🇳 → 🇬🇧' :
                  '🇬🇧 → 🇻🇳'
                }
                sx={{ 
                  mb: 3,
                  fontSize: '1rem',
                  py: 2,
                  px: 3
                }}
                color="secondary"
              />
              <Typography 
                variant="h3" 
                sx={{ 
                  mb: 2,
                  whiteSpace: 'pre-line',
                  fontWeight: 'bold',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  fontFamily: currentQuestion.type === 'missing_letters' ? 'monospace' : 'inherit',
                  color: 'text.primary',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                  animation: showCorrectAnimation ? `${glow} 0.5s ease-in-out` : 'none'
                }}
              >
                {currentQuestion.question}
              </Typography>
              {currentQuestion.hint && (
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'text.secondary',
                    fontStyle: 'italic'
                  }}
                >
                  💡 {currentQuestion.hint}
                </Typography>
              )}
            </Box>
          </Fade>

          {/* Answer Options */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 3,
            px: { xs: 0, sm: 4 }
          }}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              const showResult = isAnswered;
              
              return (
                <Grow in timeout={300 + index * 100} key={`${currentQuestionIndex}-${index}`}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => handleAnswer(option)}
                    disabled={isAnswered}
                    sx={{
                      py: 4,
                      px: 3,
                      fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                      fontWeight: 'bold',
                      position: 'relative',
                      borderRadius: 3,
                      textTransform: 'none',
                      backgroundColor: 
                        showResult && isCorrect ? '#4CAF50' :
                        showResult && isSelected && !isCorrect ? '#f44336' :
                        ['#e21b3c', '#1368ce', '#d89e00', '#9c27b0'][index],
                      boxShadow: showResult && isCorrect 
                        ? '0 0 20px rgba(76, 175, 80, 0.6)' 
                        : '0 4px 15px rgba(0,0,0,0.2)',
                      animation: 
                        showResult && isCorrect ? `${pulse} 0.5s ease-in-out` :
                        showResult && isSelected && !isCorrect ? `${shake} 0.5s ease-in-out` :
                        'none',
                      '&:hover': {
                        backgroundColor: 
                          showResult && isCorrect ? '#4CAF50' :
                          showResult && isSelected && !isCorrect ? '#f44336' :
                          ['#c51833', '#1059b3', '#b88400', '#8921a0'][index],
                        transform: !showResult ? 'scale(1.02)' : 'none',
                        boxShadow: !showResult ? '0 6px 20px rgba(0,0,0,0.3)' : undefined,
                      },
                      '&:disabled': {
                        backgroundColor: 
                          showResult && isCorrect ? '#4CAF50' :
                          showResult && isSelected && !isCorrect ? '#f44336' :
                          ['#e21b3c', '#1368ce', '#d89e00', '#9c27b0'][index],
                        opacity: showResult && !isCorrect && !isSelected ? 0.4 : 1,
                      }
                    }}
                  >
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 12, 
                      left: 12,
                      bgcolor: 'rgba(255,255,255,0.3)',
                      borderRadius: 2,
                      px: 1.5,
                      py: 0.5
                    }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                        {['Q', 'W', 'E', 'R'][index]}
                      </Typography>
                    </Box>
                    {option}
                    {showResult && isCorrect && (
                      <CheckCircleIcon sx={{ ml: 2, fontSize: '2rem' }} />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <CancelIcon sx={{ ml: 2, fontSize: '2rem' }} />
                    )}
                  </Button>
                </Grow>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Results Screen */}
      {gameState === 'results' && (
        <Fade in timeout={500}>
          <Box textAlign="center" sx={{ py: 4 }}>
            <EmojiEventsIcon sx={{ fontSize: 100, color: 'warning.main', mb: 2 }} />
            <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Congratulations!
            </Typography>
            <Typography 
              variant="h3" 
              sx={{ 
                mb: 3, 
                color: 'primary.main',
                fontWeight: 'bold',
                animation: `${pulse} 1s ease-in-out infinite`
              }}
            >
              Final Score: {score}
            </Typography>
            <Box sx={{ 
              mb: 4,
              p: 3,
              bgcolor: 'grey.100',
              borderRadius: 3,
              display: 'inline-block'
            }}>
              <Typography variant="h5" sx={{ mb: 1 }}>
                ✅ Correct: {correctAnswers} / {MAX_QUESTIONS}
              </Typography>
              <Typography variant="h5" sx={{ mb: 1 }}>
                📊 Accuracy: {Math.round((correctAnswers / MAX_QUESTIONS) * 100)}%
              </Typography>
              <Typography variant="h5">
                🔥 Best Streak: {bestStreak}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={startGame}
                sx={{ 
                  px: 4, 
                  py: 2,
                  fontSize: '1.2rem',
                  borderRadius: 2
                }}
              >
                Play Again
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                onClick={onClose}
                sx={{ 
                  px: 4, 
                  py: 2,
                  fontSize: '1.2rem',
                  borderRadius: 2
                }}
              >
                Exit
              </Button>
            </Box>
          </Box>
        </Fade>
      )}
    </Paper>
  );
};

export default VocabHoot;
