import React, { useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Unit } from '../types';
import VocabularyPresentation from './content/VocabularyPresentation';
import ExercisePresentation from './content/ExercisePresentation';
import CommunicationSection from './content/CommunicationSection';

interface ContentPresentationProps {
  content: Unit[];
  currentSection?: string;
  fontSize?: number;
  contentFilter?: 'all' | 'vocabulary';
  readAloudEnabled?: boolean;
}

const ContentPresentation: React.FC<ContentPresentationProps> = ({ 
  content, 
  currentSection, 
  fontSize = 28,
  contentFilter = 'all',
  readAloudEnabled = false
}) => {
  const showAllSections = !currentSection || currentSection === 'all';
  
  // Auto read aloud for vocabulary mode
  useEffect(() => {
    if (readAloudEnabled && contentFilter === 'vocabulary') {
      // Trigger read aloud for current vocabulary section
      const vocabElements = document.querySelectorAll('.vocabulary-word');
      if (vocabElements.length > 0) {
        // Read first word after a short delay
        setTimeout(() => {
          const firstWord = vocabElements[0]?.textContent;
          if (firstWord && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(firstWord);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
          }
        }, 500);
      }
    }
  }, [currentSection, readAloudEnabled, contentFilter]);
  
  const renderSection = (section: any) => {
    const sectionId = section.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const isCurrentSection = showAllSections || currentSection === section.title;
    
    if (!isCurrentSection) return null;

    // In vocabulary filter mode, check if section has vocabulary
    if (contentFilter === 'vocabulary') {
      const hasVocabulary = section.subsections?.some((sub: any) => 
        sub.type === 'vocabulary' || sub.content?.some((item: any) => item.type === 'vocabulary')
      ) || section.content?.some((item: any) => item.type === 'vocabulary');
      
      if (!hasVocabulary) return null;
    }

    return (
      <Box key={section.title} id={sectionId} className="content-section" sx={{ mb: 2 }}>
        <Box 
          sx={{ 
            mb: 2,
            p: 2,
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '12px',
            border: '2px solid rgba(0, 208, 132, 0.2)',
            display: 'inline-block',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 700, 
              fontSize: `${fontSize * 1.2}px`,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            {section.title}
          </Typography>
          {contentFilter === 'vocabulary' && (
            <Chip 
              label="Vocabulary Focus" 
              color="primary" 
              size="small" 
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        
        {renderSectionContent(section)}
      </Box>
    );
  };

  const renderSectionContent = (section: any) => {
    const allContent: any[] = [];
    
    // Collect content based on filter
    if (contentFilter === 'vocabulary') {
      // Only collect vocabulary content
      if (section.content) {
        section.content.forEach((item: any) => {
          if (item.type === 'vocabulary') {
            allContent.push(item);
          }
        });
      }
      
      if (section.subsections) {
        section.subsections.forEach((subsection: any) => {
          if (subsection.type === 'vocabulary') {
            allContent.push({ 
              type: 'subsection', 
              subsectionType: 'vocabulary',
              title: subsection.title,
              content: subsection.content || [],
              source: 'subsection'
            });
          } else if (subsection.content) {
            // Check for vocabulary items in other subsections
            const vocabItems = subsection.content.filter((item: any) => item.type === 'vocabulary');
            if (vocabItems.length > 0) {
              allContent.push({ 
                type: 'subsection', 
                subsectionType: 'vocabulary',
                title: subsection.title,
                content: vocabItems,
                source: 'subsection'
              });
            }
          }
        });
      }
    } else {
      // Show all content
      if (section.content && section.content.length > 0) {
        section.content.forEach((item: any, index: number) => {
          allContent.push({ ...item, source: 'direct', index });
        });
      }
      
      if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach((subsection: any) => {
          allContent.push({ 
            type: 'subsection', 
            subsectionType: subsection.type,
            title: subsection.title,
            content: subsection.content || [],
            source: 'subsection'
          });
        });
      }
    }
    
    return (
      <Box>
        {allContent.map((item, index) => {
          if (item.type === 'subsection') {
            return renderSubsectionContent(item, index);
          } else {
            return renderContentItem(item, index);
          }
        })}
      </Box>
    );
  };

  const renderSubsectionContent = (subsection: any, key: number) => {
    switch (subsection.subsectionType) {
      case 'vocabulary':
        return (
          <Box key={key} sx={{ mb: 1 }}>
            <VocabularyPresentation 
              section={{
                title: subsection.title,
                content: subsection.content
              }} 
              fontSize={fontSize}
              readAloudEnabled={readAloudEnabled}
            />
          </Box>
        );
        
      case 'exercises':
        if (contentFilter === 'vocabulary') return null;
        return (
          <Box key={key} sx={{ mb: 2 }}>
            <ExercisePresentation 
              section={{
                title: subsection.title,
                content: subsection.content
              }} 
              fontSize={fontSize}
            />
          </Box>
        );
        
      default:
        if (contentFilter === 'vocabulary') return null;
        return (
          <Box key={key} sx={{ mb: 2 }}>
            {subsection.title && (
              <Box 
                sx={{ 
                  mb: 1.5,
                  p: 1.5,
                  background: 'rgba(0, 208, 132, 0.08)',
                  borderRadius: '8px',
                  display: 'inline-block',
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 600, fontSize: `${fontSize * 1.1}px` }}>
                  {subsection.title}
                </Typography>
              </Box>
            )}
            <Box>
              {subsection.content.map((item: any, idx: number) => 
                renderContentItem(item, `${key}-${idx}`)
              )}
            </Box>
          </Box>
        );
    }
  };

  const renderContentItem = (item: any, key: any) => {
    if (contentFilter === 'vocabulary' && item.type !== 'vocabulary') {
      return null;
    }

    if (item.type === 'text') {
      return (
        <Box key={key} sx={{ 
          fontSize: `${fontSize}px`,
          '& p': { mb: 1.5, lineHeight: 1.6 },
          '& ol, & ul': { mb: 2, pl: 3 },
          '& li': { mb: 1, fontSize: 'inherit', lineHeight: 1.6 },
          '& table': { 
            width: '100%',
            borderCollapse: 'collapse',
            mb: 3,
          },
          '& th, & td': {
            border: '2px solid',
            borderColor: 'divider',
            p: 2,
            textAlign: 'left',
            fontSize: 'inherit',
          },
          '& th': {
            backgroundColor: 'rgba(0, 208, 132, 0.1)',
            fontWeight: 700,
          },
          '& strong': {
            color: '#000000',
            fontWeight: 700,
          },
          '& em': {
            color: 'rgba(0, 0, 0, 0.7)',
            fontSize: '0.9em',
          },
        }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {item.value}
          </ReactMarkdown>
        </Box>
      );
    } else if (item.type === 'dialogue') {
      return (
        <Box key={key} sx={{ mb: 2, pl: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
          <Typography variant="body1" sx={{ fontWeight: 700, fontSize: `${fontSize}px`, mb: 0.5, color: '#000000' }}>
            {item.speaker}:
          </Typography>
          <Typography variant="body1" sx={{ fontSize: `${fontSize}px`, mb: 0.5, color: '#000000', lineHeight: 1.6 }}>
            {item.text}
          </Typography>
          {item.translation && (
            <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.7)', fontSize: `${fontSize * 0.85}px` }}>
              {item.translation}
            </Typography>
          )}
        </Box>
      );
    } else if (item.type === 'vocabulary') {
      const word = item.english || item.word || '';
      const meaning = item.vietnamese || item.meaning || '';
      
      return (
        <Box key={key} sx={{ mb: 1.5, p: 1, borderRadius: '4px', bgcolor: 'rgba(0, 208, 132, 0.05)' }}>
          <Typography variant="body1" sx={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}>
            {item.number && <strong>{item.number}. </strong>}
            <strong className="vocabulary-word" style={{ fontWeight: 700, fontSize: `${fontSize * 1.1}px` }}>{word}</strong>
            {item.partOfSpeech && <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}> ({item.partOfSpeech})</span>} - 
            <span style={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.8)', marginLeft: '8px' }}>{meaning}</span>
            {item.pronunciation && (
              <em style={{ color: 'rgba(0, 0, 0, 0.6)', marginLeft: '8px', fontSize: `${fontSize * 0.9}px` }}>
                [{item.pronunciation}]
              </em>
            )}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ px: 3, py: 2 }}>
      {contentFilter === 'vocabulary' && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: `${fontSize}px` }}>
            📚 Vocabulary Focus Mode
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontSize: `${fontSize * 0.7}px` }}>
            Press V to toggle • Use arrow keys to navigate
          </Typography>
        </Box>
      )}
      
      {content.map((unit) => (
        <Box key={unit.title}>
          <Typography
            variant="h1"
            id={unit.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}
            sx={{ 
              mb: 3, 
              fontWeight: 800, 
              fontSize: `${fontSize * 1.3}px`, 
              textAlign: 'center', 
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: '3px solid',
              borderColor: 'primary.main',
              pb: 2,
            }}
          >
            {unit.title}
          </Typography>
          {unit.sections.map(renderSection)}
        </Box>
      ))}
    </Box>
  );
};

export default ContentPresentation;
