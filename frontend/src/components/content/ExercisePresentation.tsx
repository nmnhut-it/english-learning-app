import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Fade,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ExercisePresentationProps {
  section: any;
  fontSize?: number;
}

interface ParsedExercise {
  title: string;
  content: string[];
  answer?: string;
}

const ExercisePresentation: React.FC<ExercisePresentationProps> = ({ section, fontSize = 20 }) => {
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  const [expandedExercises, setExpandedExercises] = useState<Record<number, boolean>>({});

  // Parse exercises by looking for **Bài X:** pattern
  const parseExercises = (): ParsedExercise[] => {
    const exercises: ParsedExercise[] = [];
    let currentExercise: ParsedExercise | null = null;
    let currentContent: string[] = [];
    let inAnswer = false;

    const flushExercise = () => {
      if (currentExercise && currentContent.length > 0) {
        if (inAnswer) {
          currentExercise.answer = currentContent.join('\n').trim();
        } else {
          currentExercise.content = currentContent;
        }
        currentContent = [];
      }
    };

    section.content?.forEach((item: any) => {
      if (item.type === 'text') {
        const lines = item.value.split('\n');
        
        lines.forEach((line: string) => {
          // Check for exercise title
          const exerciseMatch = line.match(/^\*\*Bài\s+(\d+)[:\s](.+?)\*\*/);
          if (exerciseMatch) {
            flushExercise();
            if (currentExercise && !currentExercise.answer && currentContent.length > 0) {
              currentExercise.content = currentContent;
              currentContent = [];
            }
            if (currentExercise) {
              exercises.push(currentExercise);
            }
            
            currentExercise = {
              title: line.trim(),
              content: [],
            };
            inAnswer = false;
          }
          // Check for answer section
          else if (line.match(/^\*\*Answer[s]?:\*\*/) || line.match(/^\*\*Đáp án:\*\*/)) {
            flushExercise();
            inAnswer = true;
          }
          // Regular content
          else if (line.trim()) {
            currentContent.push(line);
          }
        });
      }
    });

    // Don't forget the last exercise
    flushExercise();
    if (currentExercise) {
      exercises.push(currentExercise);
    }

    // If no exercises were parsed, treat the whole content as one exercise
    if (exercises.length === 0 && section.content?.length > 0) {
      const allContent: string[] = [];
      let answerContent: string[] = [];
      let foundAnswer = false;

      section.content.forEach((item: any) => {
        if (item.type === 'text') {
          const lines = item.value.split('\n');
          lines.forEach((line: string) => {
            if (line.match(/^\*\*Answer[s]?:\*\*/) || line.match(/Answer[s]?:/)) {
              foundAnswer = true;
            }
            if (foundAnswer) {
              answerContent.push(line);
            } else {
              allContent.push(line);
            }
          });
        }
      });

      exercises.push({
        title: section.title || 'Exercise',
        content: allContent,
        answer: answerContent.length > 0 ? answerContent.join('\n') : undefined,
      });
    }

    return exercises;
  };

  const exercises = parseExercises();

  const toggleAnswer = (index: number) => {
    setShowAnswers(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleExpanded = (index: number) => {
    setExpandedExercises(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleAllAnswers = () => {
    const allHidden = exercises.every((_, index) => !showAnswers[index]);
    const newState: Record<number, boolean> = {};
    exercises.forEach((_, index) => {
      newState[index] = allHidden;
    });
    setShowAnswers(newState);
  };

  // Initialize all exercises as expanded
  React.useEffect(() => {
    const initialExpanded: Record<number, boolean> = {};
    exercises.forEach((_, index) => {
      initialExpanded[index] = true;
    });
    setExpandedExercises(initialExpanded);
  }, [exercises.length]);

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, fontSize: `${fontSize * 1.2}px`, color: '#000000' }}>
          {section.title}
        </Typography>
        {exercises.some(e => e.answer) && (
          <Button
            variant="outlined"
            size="large"
            onClick={toggleAllAnswers}
            startIcon={exercises.every((_, index) => showAnswers[index]) ? 
              <VisibilityOffIcon /> : <VisibilityIcon />}
            sx={{ fontSize: '1.1rem' }}
          >
            {exercises.every((_, index) => showAnswers[index]) ? 'Hide All Answers' : 'Show All Answers'}
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {exercises.map((exercise, index) => (
          <Card key={index} className="glass-card" sx={{ overflow: 'hidden', mb: 2 }}>
            {/* Exercise Header */}
            <Box
              sx={{
                p: 2,
                backgroundColor: 'rgba(0, 208, 132, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onClick={() => toggleExpanded(index)}
            >
              <Typography
              variant="h4"
              sx={{
                fontSize: `${fontSize * 1.15}px`,  // Reduced from 2x
                fontWeight: 700,
                color: '#000000',
              }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <>{children}</>,
                    strong: ({ children }) => <strong>{children}</strong>,
                  }}
                >
                  {exercise.title}
                </ReactMarkdown>
              </Typography>
              <IconButton size="large">
                {expandedExercises[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={expandedExercises[index]}>
              {/* Exercise Content */}
              <Box sx={{ p: 3 }}>
                <Box sx={{ 
                  fontSize: `${fontSize}px`,  // Same as content, not 1.5x
                  '& p': { mb: 2, fontSize: 'inherit' },
                  '& ol, & ul': { mb: 2, pl: 4, fontSize: 'inherit' },
                  '& li': { mb: 1, fontSize: 'inherit' },
                  '& table': { 
                    width: '100%',
                    borderCollapse: 'collapse',
                    mb: 3,
                  },
                  '& th, & td': {
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 2,
                    textAlign: 'left',
                  },
                  '& th': {
                    backgroundColor: 'grey.100',
                    fontWeight: 600,
                  },
                  '& strong': {
                    color: '#000000',
                    fontWeight: 700,
                  },
                }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom rendering for tables
                      table: ({ children }) => (
                        <Box sx={{ overflowX: 'auto', mb: 3 }}>
                          <table>{children}</table>
                        </Box>
                      ),
                    }}
                  >
                    {exercise.content.join('\n')}
                  </ReactMarkdown>
                </Box>

                {/* Answer Section */}
                {exercise.answer && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => toggleAnswer(index)}
                        startIcon={showAnswers[index] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        sx={{ fontSize: `${fontSize}px` }}  // Same as content
                      >
                        {showAnswers[index] ? 'Hide Answer' : 'Show Answer'}
                      </Button>
                    </Box>
                    
                    <Fade in={showAnswers[index]} timeout={500}>
                      <Box sx={{ 
                        display: showAnswers[index] ? 'block' : 'none',
                        p: 2,
                        backgroundColor: 'rgba(0, 208, 132, 0.05)',
                        borderRadius: 2,
                        border: '2px solid rgba(0, 208, 132, 0.2)',
                        fontSize: `${fontSize}px`,  // Same as content
                        '& p': { mb: 1, fontSize: 'inherit' },
                        '& strong': {
                          color: '#000000',
                          fontWeight: 700,
                        },
                      }}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                        >
                          {exercise.answer}
                        </ReactMarkdown>
                      </Box>
                    </Fade>
                  </>
                )}
              </Box>
            </Collapse>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default ExercisePresentation;
