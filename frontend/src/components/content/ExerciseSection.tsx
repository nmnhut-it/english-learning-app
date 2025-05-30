import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Alert,
  Collapse,
  IconButton,
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

interface ExerciseSectionProps {
  section: any;
}

interface Exercise {
  type: 'fill-blank' | 'multiple-choice' | 'true-false' | 'matching' | 'checkbox';
  question: string;
  answer?: string;
  options?: string[];
  correctAnswer?: string | string[];
  hint?: string;
  explanation?: string;
}

const ExerciseSection: React.FC<ExerciseSectionProps> = ({ section }) => {
  const [expanded, setExpanded] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [showResults, setShowResults] = useState<Record<number, boolean>>({});
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  // Parse exercises from content
  const parseExercises = (): Exercise[] => {
    const exercises: Exercise[] = [];
    let currentExercise: Partial<Exercise> | null = null;
    
    section.content.forEach((item: any) => {
      if (item.type === 'text') {
        const text = item.value.trim();
        
        // Detect exercise type
        if (text.includes('Fill in the blanks:') || text.includes('Complete the sentences:')) {
          currentExercise = { type: 'fill-blank', question: '' };
        } else if (text.includes('Choose the correct answer:') || text.includes('Multiple choice:')) {
          currentExercise = { type: 'multiple-choice', question: '', options: [] };
        } else if (text.includes('True or False:')) {
          currentExercise = { type: 'true-false', question: '' };
        } else if (text.includes('Match the following:')) {
          currentExercise = { type: 'matching', question: '' };
        } else if (text.includes('Select all that apply:')) {
          currentExercise = { type: 'checkbox', question: '', options: [], correctAnswer: [] };
        }
        
        // Parse question and options
        if (currentExercise) {
          if (text.match(/^\d+\./)) {
            // This is a question
            if (currentExercise.question) {
              exercises.push(currentExercise as Exercise);
              currentExercise = { ...currentExercise, question: text };
            } else {
              currentExercise.question = text;
            }
          } else if (text.match(/^[a-d]\)/i) && currentExercise.type === 'multiple-choice') {
            // This is an option
            if (!currentExercise.options) currentExercise.options = [];
            currentExercise.options.push(text);
          } else if (text.includes('Answer:') || text.includes('Correct answer:')) {
            // This is the answer
            const answerText = text.replace(/Answer:|Correct answer:/i, '').trim();
            currentExercise.correctAnswer = answerText;
          } else if (text.includes('Hint:')) {
            currentExercise.hint = text.replace('Hint:', '').trim();
          }
        }
      }
    });
    
    if (currentExercise && currentExercise.question) {
      exercises.push(currentExercise as Exercise);
    }
    
    // If no exercises were parsed, create sample exercises
    if (exercises.length === 0) {
      exercises.push(
        {
          type: 'fill-blank',
          question: '1. I enjoy _____ (read) books in my free time.',
          correctAnswer: 'reading',
          hint: 'Use the -ing form of the verb',
          explanation: 'After "enjoy" we use the gerund (-ing form) of the verb.'
        },
        {
          type: 'multiple-choice',
          question: '2. Which activity is NOT a leisure activity?',
          options: ['a) Playing chess', 'b) Working overtime', 'c) Watching movies', 'd) Going hiking'],
          correctAnswer: 'b) Working overtime',
          explanation: 'Working overtime is a work activity, not a leisure activity.'
        },
        {
          type: 'true-false',
          question: '3. True or False: Hobbies can help reduce stress.',
          correctAnswer: 'True',
          explanation: 'Hobbies are beneficial for mental health and can help reduce stress.'
        },
        {
          type: 'checkbox',
          question: '4. Select all indoor activities:',
          options: ['Reading', 'Swimming', 'Cooking', 'Hiking', 'Playing video games'],
          correctAnswer: ['Reading', 'Cooking', 'Playing video games'],
          explanation: 'Reading, cooking, and playing video games are typically done indoors.'
        }
      );
    }
    
    return exercises;
  };

  const exercises = parseExercises();

  const handleAnswerChange = (index: number, value: string | string[]) => {
    setAnswers({ ...answers, [index]: value });
  };

  const checkAnswer = (index: number) => {
    setShowResults({ ...showResults, [index]: true });
  };

  const isCorrect = (index: number, exercise: Exercise): boolean => {
    const userAnswer = answers[index];
    if (!userAnswer) return false;
    
    if (exercise.type === 'checkbox') {
      const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
      const correctAnswerArray = Array.isArray(exercise.correctAnswer) ? exercise.correctAnswer : [];
      return userAnswerArray.length === correctAnswerArray.length &&
        userAnswerArray.every(ans => correctAnswerArray.includes(ans));
    }
    
    return String(userAnswer).toLowerCase().trim() === String(exercise.correctAnswer).toLowerCase().trim();
  };

  const getProgress = (): number => {
    const answered = Object.keys(answers).length;
    return (answered / exercises.length) * 100;
  };

  const handleSubmitAll = () => {
    const allResults: Record<number, boolean> = {};
    exercises.forEach((_, index) => {
      allResults[index] = true;
    });
    setShowResults(allResults);
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setShowResults({});
    setShowHints({});
    setSubmitted(false);
  };

  const toggleHint = (index: number) => {
    setShowHints({ ...showHints, [index]: !showHints[index] });
  };

  const renderExercise = (exercise: Exercise, index: number) => {
    const answered = answers[index] !== undefined;
    const showResult = showResults[index];
    const correct = showResult && isCorrect(index, exercise);

    switch (exercise.type) {
      case 'fill-blank':
        return (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {exercise.question.replace(/_____/g, '______')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                variant="outlined"
                size="small"
                value={answers[index] || ''}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                disabled={showResult}
                sx={{ width: 200 }}
                error={showResult && !correct}
                helperText={showResult && !correct ? `Correct: ${exercise.correctAnswer}` : ''}
              />
              {!showResult && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => checkAnswer(index)}
                  disabled={!answered}
                >
                  Check
                </Button>
              )}
              {showResult && (
                correct ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />
              )}
              {exercise.hint && !showResult && (
                <IconButton size="small" onClick={() => toggleHint(index)}>
                  <LightbulbIcon />
                </IconButton>
              )}
            </Box>
            <Collapse in={showHints[index]}>
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="caption">{exercise.hint}</Typography>
              </Alert>
            </Collapse>
            {showResult && exercise.explanation && (
              <Alert severity={correct ? 'success' : 'warning'} sx={{ mt: 1 }}>
                <Typography variant="caption">{exercise.explanation}</Typography>
              </Alert>
            )}
          </Box>
        );

      case 'multiple-choice':
        return (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {exercise.question}
            </Typography>
            <RadioGroup
              value={answers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
            >
              {exercise.options?.map((option, optIndex) => (
                <FormControlLabel
                  key={optIndex}
                  value={option}
                  control={<Radio />}
                  label={option}
                  disabled={showResult}
                  sx={{
                    color: showResult && option === exercise.correctAnswer ? 'success.main' : 
                           showResult && option === answers[index] && !correct ? 'error.main' : 'inherit'
                  }}
                />
              ))}
            </RadioGroup>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              {!showResult && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => checkAnswer(index)}
                  disabled={!answered}
                >
                  Check
                </Button>
              )}
              {showResult && (
                correct ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />
              )}
            </Box>
            {showResult && exercise.explanation && (
              <Alert severity={correct ? 'success' : 'warning'} sx={{ mt: 1 }}>
                <Typography variant="caption">{exercise.explanation}</Typography>
              </Alert>
            )}
          </Box>
        );

      case 'true-false':
        return (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {exercise.question}
            </Typography>
            <RadioGroup
              row
              value={answers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
            >
              <FormControlLabel
                value="True"
                control={<Radio />}
                label="True"
                disabled={showResult}
                sx={{
                  color: showResult && 'True' === exercise.correctAnswer ? 'success.main' : 
                         showResult && 'True' === answers[index] && !correct ? 'error.main' : 'inherit'
                }}
              />
              <FormControlLabel
                value="False"
                control={<Radio />}
                label="False"
                disabled={showResult}
                sx={{
                  color: showResult && 'False' === exercise.correctAnswer ? 'success.main' : 
                         showResult && 'False' === answers[index] && !correct ? 'error.main' : 'inherit'
                }}
              />
            </RadioGroup>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              {!showResult && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => checkAnswer(index)}
                  disabled={!answered}
                >
                  Check
                </Button>
              )}
              {showResult && (
                correct ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />
              )}
            </Box>
            {showResult && exercise.explanation && (
              <Alert severity={correct ? 'success' : 'warning'} sx={{ mt: 1 }}>
                <Typography variant="caption">{exercise.explanation}</Typography>
              </Alert>
            )}
          </Box>
        );

      case 'checkbox':
        const selectedValues = (answers[index] as string[]) || [];
        return (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {exercise.question}
            </Typography>
            <FormGroup>
              {exercise.options?.map((option, optIndex) => (
                <FormControlLabel
                  key={optIndex}
                  control={
                    <Checkbox
                      checked={selectedValues.includes(option)}
                      onChange={(e) => {
                        const newValues = e.target.checked
                          ? [...selectedValues, option]
                          : selectedValues.filter(v => v !== option);
                        handleAnswerChange(index, newValues);
                      }}
                      disabled={showResult}
                    />
                  }
                  label={option}
                  sx={{
                    color: showResult && exercise.correctAnswer?.includes(option) ? 'success.main' : 
                           showResult && selectedValues.includes(option) && !exercise.correctAnswer?.includes(option) ? 'error.main' : 'inherit'
                  }}
                />
              ))}
            </FormGroup>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              {!showResult && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => checkAnswer(index)}
                  disabled={selectedValues.length === 0}
                >
                  Check
                </Button>
              )}
              {showResult && (
                correct ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />
              )}
            </Box>
            {showResult && exercise.explanation && (
              <Alert severity={correct ? 'success' : 'warning'} sx={{ mt: 1 }}>
                <Typography variant="caption">{exercise.explanation}</Typography>
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const getScore = (): string => {
    let correctCount = 0;
    exercises.forEach((exercise, index) => {
      if (showResults[index] && isCorrect(index, exercise)) {
        correctCount++;
      }
    });
    return `${correctCount} / ${exercises.length}`;
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" component="h3" sx={{ fontWeight: 500 }}>
            ✏️ {section.title || 'Exercises'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {submitted && (
              <Chip
                label={`Score: ${getScore()}`}
                color={parseInt(getScore()) === exercises.length ? 'success' : 'primary'}
              />
            )}
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <LinearProgress
            variant="determinate"
            value={getProgress()}
            sx={{ mb: 3, height: 8, borderRadius: 1 }}
          />

          {exercises.map((exercise, index) => (
            <React.Fragment key={index}>
              {renderExercise(exercise, index)}
              {index < exercises.length - 1 && <Divider sx={{ my: 2 }} />}
            </React.Fragment>
          ))}

          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center' }}>
            {!submitted && (
              <Button
                variant="contained"
                onClick={handleSubmitAll}
                disabled={Object.keys(answers).length === 0}
                size="large"
              >
                Submit All Answers
              </Button>
            )}
            {Object.keys(answers).length > 0 && (
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
                size="large"
              >
                Reset
              </Button>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ExerciseSection;
