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
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        {part.label})
      </Typography>
      <Typography variant="body1" sx={{ ml: 2, whiteSpace: 'pre-wrap' }}>
        {part.content}
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
  const [showAnswers, setShowAnswers] = useState(false);
  
  const renderContent = () => {
    if (!section.content) return null;
    
    return section.content.map((item: any, index: number) => {
      // Handle exercise type
      if (item.type === 'exercise') {
        return (
          <Box key={index} sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            {/* Exercise Header */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Bài {item.number}: {item.title}
            </Typography>
            
            {/* Exercise Instruction */}
            {item.instruction && (
              <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                {item.instruction}
              </Typography>
            )}
            
            {/* Exercise Parts */}
            {item.parts && item.parts.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {item.parts.map((part: any, partIndex: number) => (
                  <ExercisePart 
                    key={partIndex} 
                    part={part} 
                    showAnswer={showAnswers}
                  />
                ))}
              </Box>
            )}
            
            {/* Answer Section */}
            {item.answer && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Đáp án:
                  </Typography>
                  <Button
                    size="small"
                    startIcon={showAnswers ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    onClick={() => setShowAnswers(!showAnswers)}
                  >
                    {showAnswers ? 'Ẩn' : 'Hiện'} đáp án
                  </Button>
                </Box>
                <Collapse in={showAnswers}>
                  <Alert severity="success" sx={{ mt: 1 }}>
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
              <strong>{item.english}</strong> - {item.vietnamese}
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
            ✍️ {section.title || 'Exercises'}
          </Typography>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
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
