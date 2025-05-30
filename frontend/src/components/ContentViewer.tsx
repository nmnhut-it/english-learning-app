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
      case 'closer-look':
        if (section.subsections) {
          return section.subsections.map((sub: any) => {
            if (sub.type === 'vocabulary') {
              return <VocabularySection key={sub.title} section={sub} />;
            }
            if (sub.type === 'pronunciation') {
              return <PronunciationSection key={sub.title} section={sub} />;
            }
            return null;
          });
        }
        return null;
      case 'communication':
        return <CommunicationSection key={section.title} section={section} />;
      case 'skills':
        return <SkillsSection key={section.title} section={section} />;
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
