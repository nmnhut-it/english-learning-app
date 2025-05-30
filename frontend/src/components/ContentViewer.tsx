import React from 'react';
import { Box } from '@mui/material';
import { Unit } from '../types';
import GettingStarted from './content/GettingStarted';
import VocabularySection from './content/VocabularySection';
import PronunciationSection from './content/PronunciationSection';
import ExerciseSection from './content/ExerciseSection';
import SkillsSection from './content/SkillsSection';
import CommunicationSection from './content/CommunicationSection';

interface ContentViewerProps {
  content: Unit[];
}

const ContentViewer: React.FC<ContentViewerProps> = ({ content }) => {
  const renderSection = (section: any) => {
    switch (section.type) {
      case 'getting-started':
        return <GettingStarted key={section.title} section={section} />;
        
      case 'closer-look-1':
        // This section typically has vocabulary and pronunciation subsections
        return (
          <Box key={section.title}>
            <Box component="h2" sx={{ fontSize: '2rem', fontWeight: 600, mb: 3, mt: 4 }}>
              {section.title}
            </Box>
            {section.subsections?.map((sub: any) => {
              if (sub.type === 'vocabulary') {
                return <VocabularySection key={sub.title} section={sub} />;
              }
              if (sub.type === 'pronunciation') {
                return <PronunciationSection key={sub.title} section={sub} />;
              }
              return <ExerciseSection key={sub.title} section={sub} />;
            })}
            {section.content?.length > 0 && <ExerciseSection section={section} />}
          </Box>
        );
        
      case 'closer-look-2':
        // Grammar section with exercises
        return (
          <Box key={section.title}>
            <Box component="h2" sx={{ fontSize: '2rem', fontWeight: 600, mb: 3, mt: 4 }}>
              {section.title}
            </Box>
            {section.subsections?.map((sub: any) => {
              if (sub.type === 'grammar') {
                return <ExerciseSection key={sub.title} section={sub} />;
              }
              return <ExerciseSection key={sub.title} section={sub} />;
            })}
            {!section.subsections && <ExerciseSection section={section} />}
          </Box>
        );
        
      case 'communication':
        return <CommunicationSection key={section.title} section={section} />;
        
      case 'skills-1':
      case 'skills-2':
        return <SkillsSection key={section.title} section={section} />;
        
      case 'looking-back':
        return (
          <Box key={section.title}>
            <Box component="h2" sx={{ fontSize: '2rem', fontWeight: 600, mb: 3, mt: 4 }}>
              {section.title}
            </Box>
            <ExerciseSection section={section} />
          </Box>
        );
        
      default:
        if (section.subsections?.some((sub: any) => sub.type === 'exercises')) {
          return <ExerciseSection key={section.title} section={section} />;
        }
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {content.map((unit) => (
        <Box key={unit.title}>
          <Box
            component="h1"
            id={unit.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}
            sx={{ fontSize: '2.5rem', fontWeight: 600, mb: 4, mt: 0 }}
          >
            {unit.title}
          </Box>
          {unit.sections.map(renderSection)}
        </Box>
      ))}
    </Box>
  );
};

export default ContentViewer;
