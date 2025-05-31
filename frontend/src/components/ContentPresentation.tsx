import React from 'react';
import { Box, Typography } from '@mui/material';
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
}

const ContentPresentation: React.FC<ContentPresentationProps> = ({ content, currentSection, fontSize = 16 }) => {
  // If currentSection is empty or 'all', show all sections
  const showAllSections = !currentSection || currentSection === 'all';
  
  const renderSection = (section: any) => {
    // Check if this is the current section (for section navigation)
    const sectionId = section.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const isCurrentSection = showAllSections || currentSection === section.title;
    
    if (!isCurrentSection) return null;

    // Always show section title and render all its content
    return (
      <Box key={section.title} id={sectionId}>
        <Typography variant="h2" sx={{ mb: 2, fontWeight: 600, fontSize: `${fontSize * 2}px` }}>
          {section.title}
        </Typography>
        
        {/* Add section-specific labels */}
        {section.type === 'skills-1' && (
          <Typography variant="h4" sx={{ mb: 1, color: 'primary.main', fontSize: `${fontSize * 1.5}px` }}>
            📖 Reading & Speaking
          </Typography>
        )}
        {section.type === 'skills-2' && (
          <Typography variant="h4" sx={{ mb: 1, color: 'primary.main', fontSize: `${fontSize * 1.5}px` }}>
            👂 Listening & Writing
          </Typography>
        )}
        
        {/* Render all content in order */}
        {renderSectionContent(section)}
      </Box>
    );
  };

  const renderSectionContent = (section: any) => {
    const allContent: any[] = [];
    
    // First, add any direct content from the section
    if (section.content && section.content.length > 0) {
      section.content.forEach((item: any, index: number) => {
        allContent.push({ ...item, source: 'direct', index });
      });
    }
    
    // Then, add content from subsections in order
    if (section.subsections && section.subsections.length > 0) {
      section.subsections.forEach((subsection: any) => {
        // Add subsection as a content item
        allContent.push({ 
          type: 'subsection', 
          subsectionType: subsection.type,
          title: subsection.title,
          content: subsection.content || [],
          source: 'subsection'
        });
      });
    }
    
    // Now render all content in order
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
    // Special handling for specific subsection types
    switch (subsection.subsectionType) {
      case 'vocabulary':
        return (
          <Box key={key} sx={{ mb: 2 }}>
            <VocabularyPresentation 
              section={{
                title: subsection.title,
                content: subsection.content
              }} 
              fontSize={fontSize}
            />
          </Box>
        );
        
      case 'exercises':
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
        
      case 'pronunciation':
      case 'grammar':
      case 'content':
      case 'activities':
      case 'listening':
      case 'reading':
      case 'speaking':
      case 'writing':
        return (
          <Box key={key} sx={{ mb: 2 }}>
            <Typography variant="h3" sx={{ mb: 1.5, fontWeight: 600, fontSize: `${fontSize * 1.75}px` }}>
              {subsection.title}
            </Typography>
            <Box>
              {subsection.content.map((item: any, idx: number) => 
                renderContentItem(item, `${key}-${idx}`)
              )}
            </Box>
          </Box>
        );
        
      default:
        // Generic subsection rendering
        return (
          <Box key={key} sx={{ mb: 2 }}>
            {subsection.title && (
              <Typography variant="h3" sx={{ mb: 1.5, fontWeight: 600, fontSize: `${fontSize * 1.75}px` }}>
                {subsection.title}
              </Typography>
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
    if (item.type === 'text') {
      return (
        <Box key={key} sx={{ 
          fontSize: `${fontSize}px`,
          '& p': { mb: 1 },
          '& ol, & ul': { mb: 1, pl: 3 },
          '& li': { mb: 0.5, fontSize: 'inherit' },
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
            fontSize: 'inherit',
          },
          '& th': {
            backgroundColor: 'grey.100',
            fontWeight: 600,
          },
          '& strong': {
            color: 'primary.main',
          },
          '& em': {
            color: 'text.secondary',
            fontSize: '0.9em',
          },
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            mt: 3,
            mb: 2,
          },
        }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {item.value}
          </ReactMarkdown>
        </Box>
      );
    } else if (item.type === 'dialogue') {
      return (
        <Box key={key} sx={{ mb: 1.5, pl: 2, borderLeft: '3px solid', borderColor: 'primary.light' }}>
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: `${fontSize}px`, mb: 0.25 }}>
            {item.speaker}:
          </Typography>
          <Typography variant="body1" sx={{ fontSize: `${fontSize}px`, mb: 0.5 }}>
            {item.text}
          </Typography>
          {item.translation && (
            <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: `${fontSize * 0.9}px` }}>
              {item.translation}
            </Typography>
          )}
        </Box>
      );
    } else if (item.type === 'vocabulary') {
      // Normalize vocabulary fields
      const word = item.english || item.word || '';
      const meaning = item.vietnamese || item.meaning || '';
      
      // Inline vocabulary display
      return (
        <Box key={key} sx={{ mb: 0.5 }}>
          <Typography variant="body1" sx={{ fontSize: `${fontSize * 1.25}px` }}>
            {item.number && `${item.number}. `}
            <strong>{word}</strong>
            {item.partOfSpeech && ` (${item.partOfSpeech})`} - {meaning} - 
            <em> {item.pronunciation}</em>
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const renderGenericContent = (section: any) => {
    if (!section.content) return null;

    return (
      <Box sx={{ 
        fontSize: `${fontSize}px`,
        '& p': { mb: 1 },
        '& ol, & ul': { mb: 1, pl: 3 },
        '& li': { mb: 0.5, fontSize: 'inherit' },
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
          color: 'primary.main',
        },
        '& em': {
          color: 'text.secondary',
          fontSize: '0.9em',
        },
        '& blockquote': {
          borderLeft: '4px solid',
          borderColor: 'primary.main',
          pl: 3,
          ml: 0,
          my: 3,
          fontStyle: 'italic',
        },
        '& code': {
          backgroundColor: 'grey.100',
          px: 1,
          py: 0.5,
          borderRadius: 0.5,
          fontFamily: 'monospace',
        },
        '& pre': {
          backgroundColor: 'grey.100',
          p: 2,
          borderRadius: 1,
          overflow: 'auto',
          '& code': {
            backgroundColor: 'transparent',
            p: 0,
          },
        },
      }}>
        {section.content.map((item: any, index: number) => {
          if (item.type === 'text') {
            return (
              <ReactMarkdown key={index} remarkPlugins={[remarkGfm]}>
                {item.value}
              </ReactMarkdown>
            );
          } else if (item.type === 'dialogue') {
            return (
              <Box key={index} sx={{ mb: 1.5, pl: 2, borderLeft: '3px solid', borderColor: 'primary.light' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: `${fontSize}px`, mb: 0.25 }}>
                  {item.speaker}:
                </Typography>
                <Typography variant="body1" sx={{ fontSize: `${fontSize}px`, mb: 0.5 }}>
                  {item.text}
                </Typography>
                {item.translation && (
                  <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: `${fontSize * 0.9}px` }}>
                    {item.translation}
                  </Typography>
                )}
              </Box>
            );
          } else if (item.type === 'vocabulary') {
            // Normalize vocabulary fields
            const word = item.english || item.word || '';
            const meaning = item.vietnamese || item.meaning || '';
            
            // Inline vocabulary in generic content
            return (
              <Box key={index} sx={{ mb: 0.5 }}>
                <Typography variant="body1" sx={{ fontSize: `${fontSize * 1.25}px` }}>
                  {item.number && `${item.number}. `}
                  <strong>{word}</strong>
                  {item.partOfSpeech && ` (${item.partOfSpeech})`} - {meaning} - 
                  <em> {item.pronunciation}</em>
                </Typography>
              </Box>
            );
          }
          return null;
        })}
      </Box>
    );
  };

  return (
    <Box>
      {content.map((unit) => (
        <Box key={unit.title}>
          <Typography
            variant="h1"
            id={unit.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}
            sx={{ mb: 2, fontWeight: 700, fontSize: `${fontSize * 2.5}px` }}
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
