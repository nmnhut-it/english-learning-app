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
}

const ContentPresentation: React.FC<ContentPresentationProps> = ({ content, currentSection }) => {
  const renderSection = (section: any) => {
    // Check if this is the current section (for section navigation)
    const sectionId = section.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const isCurrentSection = !currentSection || currentSection === section.title;
    
    if (!isCurrentSection) return null;

    switch (section.type) {
      case 'getting-started':
        return (
          <Box key={section.title} id={sectionId}>
            <Typography variant="h2" sx={{ mb: 4, fontWeight: 600 }}>
              {section.title}
            </Typography>
            {renderSubsections(section)}
          </Box>
        );

      case 'closer-look-1':
      case 'closer-look-2':
        return (
          <Box key={section.title} id={sectionId}>
            <Typography variant="h2" sx={{ mb: 4, fontWeight: 600 }}>
              {section.title}
            </Typography>
            {renderSubsections(section)}
          </Box>
        );

      case 'communication':
        return (
          <Box key={section.title} id={sectionId}>
            <CommunicationSection section={section} />
          </Box>
        );

      case 'skills-1':
        return (
          <Box key={section.title} id={sectionId}>
            <Typography variant="h2" sx={{ mb: 4, fontWeight: 600 }}>
              {section.title}
            </Typography>
            <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
              📖 Reading & Speaking
            </Typography>
            {renderSubsections(section)}
          </Box>
        );

      case 'skills-2':
        return (
          <Box key={section.title} id={sectionId}>
            <Typography variant="h2" sx={{ mb: 4, fontWeight: 600 }}>
              {section.title}
            </Typography>
            <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
              👂 Listening & Writing
            </Typography>
            {renderSubsections(section)}
          </Box>
        );

      case 'looking-back':
        return (
          <Box key={section.title} id={sectionId}>
            <Typography variant="h2" sx={{ mb: 4, fontWeight: 600 }}>
              {section.title}
            </Typography>
            {/* Check if it has exercises subsection or render as markdown */}
            {section.subsections?.some((sub: any) => sub.type === 'exercises') ? (
              renderSubsections(section)
            ) : (
              <Box sx={{ 
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                '& p': { mb: 2 },
                '& ol, & ul': { mb: 2, pl: 4 },
                '& li': { mb: 1.5, fontSize: 'inherit' },
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
                '& h3': {
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                  fontWeight: 600,
                  mt: 4,
                  mb: 2,
                },
                '& pre': {
                  backgroundColor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '1.1rem',
                },
              }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {section.content?.map((item: any) => 
                    item.type === 'text' ? item.value : ''
                  ).join('\n\n')}
                </ReactMarkdown>
              </Box>
            )}
          </Box>
        );

      default:
        return (
          <Box key={section.title} id={sectionId}>
            <Typography variant="h2" sx={{ mb: 4, fontWeight: 600 }}>
              {section.title}
            </Typography>
            {renderGenericContent(section)}
          </Box>
        );
    }
  };

  const renderSubsections = (section: any) => {
    // First render any direct content
    if (section.content && section.content.length > 0) {
      const hasNonTextContent = section.content.some((item: any) => item.type !== 'text');
      
      if (hasNonTextContent) {
        // Has vocabulary or dialogue items
        if (section.content.some((item: any) => item.type === 'vocabulary')) {
          return <VocabularyPresentation section={section} />;
        }
        // Render mixed content
        return renderGenericContent(section);
      }
    }

    // Then render subsections
    return (
      <>
        {section.subsections?.map((subsection: any) => {
          switch (subsection.type) {
            case 'vocabulary':
              return <VocabularyPresentation key={subsection.title} section={subsection} />;
            
            case 'exercises':
              return <ExercisePresentation key={subsection.title} section={subsection} />;
            
            case 'pronunciation':
            case 'grammar':
            case 'content':
            case 'activities':
            case 'listening':
            case 'reading':
            case 'speaking':
            case 'writing':
              return (
                <Box key={subsection.title} sx={{ mb: 4 }}>
                  <Typography variant="h3" sx={{ mb: 3, fontWeight: 600 }}>
                    {subsection.title}
                  </Typography>
                  {renderGenericContent(subsection)}
                </Box>
              );
            
            default:
              return (
                <Box key={subsection.title} sx={{ mb: 4 }}>
                  {renderGenericContent(subsection)}
                </Box>
              );
          }
        })}
      </>
    );
  };

  const renderGenericContent = (section: any) => {
    if (!section.content) return null;

    return (
      <Box sx={{ 
        fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
        '& p': { mb: 2 },
        '& ol, & ul': { mb: 2, pl: 4 },
        '& li': { mb: 1.5, fontSize: 'inherit' },
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
              <Box key={index} sx={{ mb: 3, pl: 2, borderLeft: '3px solid', borderColor: 'primary.light' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 'inherit', mb: 0.5 }}>
                  {item.speaker}:
                </Typography>
                <Typography variant="body1" sx={{ fontSize: 'inherit', mb: 1 }}>
                  {item.text}
                </Typography>
                {item.translation && (
                  <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: '0.9em' }}>
                    {item.translation}
                  </Typography>
                )}
              </Box>
            );
          } else if (item.type === 'vocabulary') {
            // Inline vocabulary in generic content
            return (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ fontSize: 'inherit' }}>
                  {item.number && `${item.number}. `}
                  <strong>{item.english}</strong>
                  {item.partOfSpeech && ` (${item.partOfSpeech})`} - {item.vietnamese} - 
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
            sx={{ mb: 4, fontWeight: 700 }}
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
