import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Collapse,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import TableRenderer from './TableRenderer';

interface ExerciseSectionProps {
  section: any;
}

interface ExercisePartProps {
  part: any;
  showAnswer?: boolean;
}

const ExercisePart: React.FC<ExercisePartProps> = ({ part, showAnswer }) => {
  return (
    <Box sx={{ ml: 2, mb: 1 }}>
      <Typography variant="body1" component="div">
        <strong>{part.label})</strong> {part.content}
      </Typography>
      {part.answer && showAnswer && (
        <Alert severity="info" sx={{ ml: 2, mt: 1 }}>
          <Typography variant="body2">{part.answer}</Typography>
        </Alert>
      )}
    </Box>
  );
};

const ExerciseSection: React.FC<ExerciseSectionProps> = ({ section }) => {
  const [expanded, setExpanded] = useState(true);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [individualAnswers, setIndividualAnswers] = useState<Record<number, boolean>>({});
  
  // Count total exercises
  const exerciseCount = section.content?.filter((item: any) => item.type === 'exercise').length || 0;
  const hasExercises = exerciseCount > 0;
  
  const toggleIndividualAnswer = (index: number) => {
    setIndividualAnswers(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  const renderContent = () => {
    if (!section.content) return null;
    
    return section.content.map((item: any, index: number) => {
      // Handle exercise type
      if (item.type === 'exercise') {
        const showAnswer = showAllAnswers || individualAnswers[index];
        
        return (
          <Box key={index} sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            {/* Exercise Header */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {item.number && `Bài ${item.number}: `}{item.title}
            </Typography>
            
            {/* Vietnamese Instruction */}
            {item.instruction && item.instruction.trim() && (
              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                ({item.instruction})
              </Typography>
            )}
            
            {/* Exercise Parts */}
            {item.parts && item.parts.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {item.parts.map((part: any, partIndex: number) => (
                  <ExercisePart 
                    key={partIndex} 
                    part={part} 
                    showAnswer={showAnswer}
                  />
                ))}
              </Box>
            )}
            
            {/* Table if present */}
            {item.table && <TableRenderer table={item.table} />}
            
            {/* Answer Section */}
            {item.answer && (
              <Box sx={{ mt: 2 }}>
                {!showAllAnswers && (
                  <Button
                    size="small"
                    startIcon={individualAnswers[index] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    onClick={() => toggleIndividualAnswer(index)}
                    sx={{ mb: 1 }}
                  >
                    {individualAnswers[index] ? 'ẨN' : 'HIỆN'} ĐÁP ÁN
                  </Button>
                )}
                <Collapse in={showAnswer}>
                  <Alert severity="success">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      {item.answerTitle || 'Đáp án'}:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {item.answer}
                    </Typography>
                  </Alert>
                </Collapse>
              </Box>
            )}
          </Box>
        );
      }
      
      // Handle table type
      else if (item.type === 'table') {
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <TableRenderer table={item} />
          </Box>
        );
      }
      
      // Handle text type (fallback for non-exercise content)
      else if (item.type === 'text') {
        // Split text into lines for better formatting
        const lines = item.value.split('\n').filter((line: string) => line.trim());
        
        return (
          <Box key={index} sx={{ mb: 2 }}>
            {lines.map((line: string, lineIndex: number) => {
              // Check for special formatting
              if (line.match(/^\*\*[^*]+\*\*$/)) {
                // Bold line
                return (
                  <Typography key={lineIndex} variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    {line.replace(/\*\*/g, '')}
                  </Typography>
                );
              } else if (line.match(/^\*\*[^:]+:\*\*/)) {
                // Exercise title (legacy format)
                return (
                  <Typography key={lineIndex} variant="body1" sx={{ fontWeight: 600, mb: 0.5, mt: 2 }}>
                    {line.replace(/\*\*/g, '')}
                  </Typography>
                );
              } else if (line.match(/^\d+\./)) {
                // Numbered item
                return (
                  <Typography key={lineIndex} variant="body1" sx={{ ml: 2, mb: 0.5 }}>
                    {line}
                  </Typography>
                );
              } else if (line.match(/^[a-zA-Z]\./)) {
                // Letter option
                return (
                  <Typography key={lineIndex} variant="body2" sx={{ ml: 4, mb: 0.5 }}>
                    {line}
                  </Typography>
                );
              } else if (line.startsWith('|')) {
                // Table - render as preformatted text
                return (
                  <Typography 
                    key={lineIndex} 
                    variant="body2" 
                    component="pre"
                    sx={{ 
                      fontFamily: 'monospace',
                      bgcolor: 'grey.50',
                      p: 1,
                      borderRadius: 1,
                      overflow: 'auto'
                    }}
                  >
                    {line}
                  </Typography>
                );
              } else {
                // Regular text
                return (
                  <Typography key={lineIndex} variant="body1" sx={{ mb: 0.5 }}>
                    {line}
                  </Typography>
                );
              }
            })}
          </Box>
        );
      } else if (item.type === 'vocabulary') {
        // Vocabulary item in exercise context
        return (
          <Box key={index} sx={{ ml: 2, mb: 1 }}>
            <Typography variant="body1">
              {item.number && `${item.number}. `}
              <strong>{item.word}</strong>
              {item.partOfSpeech && ` (${item.partOfSpeech})`}
              {' - '}
              {item.meaning}
              {item.pronunciation && ` /${item.pronunciation}/`}
            </Typography>
          </Box>
        );
      }
      return null;
    });
  };

  return (
    <Card sx={{ mb: 2, boxShadow: 1 }}>
      <CardContent sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        '&:last-child': { pb: 2 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" component="h3" sx={{ 
            fontWeight: 500,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            ✍️ {section.title || 'Exercises - Bài tập'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {hasExercises && (
              <Button
                size="small"
                variant="outlined"
                startIcon={showAllAnswers ? <VisibilityOffIcon /> : <VisibilityIcon />}
                onClick={() => setShowAllAnswers(!showAllAnswers)}
              >
                {showAllAnswers ? 'ẨN' : 'HIỆN'} TẤT CẢ ĐÁP ÁN
              </Button>
            )}
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {renderContent()}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ExerciseSection;
