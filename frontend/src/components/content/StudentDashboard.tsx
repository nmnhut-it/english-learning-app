import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  AppBar,
  Toolbar,
  Container
} from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import VocabHoot from './vocabhoot/VocabHoot';

interface StudentDashboardProps {
  content: any;
  onSwitchToTeacher: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ content, onSwitchToTeacher }) => {
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [studentStats, setStudentStats] = useState({
    totalScore: 0,
    gamesPlayed: 0,
    accuracy: 0,
    streak: 0
  });

  // Extract all vocabulary sections from content
  const getVocabularySections = () => {
    const sections: any[] = [];
    
    if (!content) return sections;
    
    content.forEach((unit: any) => {
      unit.sections?.forEach((section: any) => {
        // Check if section has vocabulary
        const vocabItems = section.content?.filter((item: any) => item.type === 'vocabulary') || [];
        
        if (vocabItems.length > 0) {
          sections.push({
            unitTitle: unit.title,
            sectionTitle: section.title,
            vocabulary: vocabItems.map((item: any) => ({
              english: item.english || item.word || '',
              vietnamese: item.vietnamese || item.meaning || '',
              partOfSpeech: item.partOfSpeech,
              pronunciation: item.pronunciation
            })),
            wordCount: vocabItems.length,
            difficulty: vocabItems.length < 10 ? 'Easy' : vocabItems.length < 20 ? 'Medium' : 'Hard'
          });
        }
        
        // Also check subsections
        section.subsections?.forEach((subsection: any) => {
          if (subsection.type === 'vocabulary' && subsection.content) {
            sections.push({
              unitTitle: unit.title,
              sectionTitle: `${section.title} - ${subsection.title}`,
              vocabulary: subsection.content.map((item: any) => ({
                english: item.english || item.word || '',
                vietnamese: item.vietnamese || item.meaning || '',
                partOfSpeech: item.partOfSpeech,
                pronunciation: item.pronunciation
              })),
              wordCount: subsection.content.length,
              difficulty: subsection.content.length < 10 ? 'Easy' : subsection.content.length < 20 ? 'Medium' : 'Hard'
            });
          }
        });
      });
    });
    
    return sections;
  };

  const vocabularySections = getVocabularySections();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'error';
      default: return 'default';
    }
  };

  // Load saved stats
  useEffect(() => {
    const saved = localStorage.getItem('vocabhoot_stats');
    if (saved) {
      setStudentStats(JSON.parse(saved));
    }
  }, []);

  const handleGameComplete = (score: number, accuracy: number) => {
    const newStats = {
      totalScore: studentStats.totalScore + score,
      gamesPlayed: studentStats.gamesPlayed + 1,
      accuracy: Math.round((studentStats.accuracy * studentStats.gamesPlayed + accuracy) / (studentStats.gamesPlayed + 1)),
      streak: studentStats.streak + 1
    };
    setStudentStats(newStats);
    localStorage.setItem('vocabhoot_stats', JSON.stringify(newStats));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <SportsEsportsIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            VocabHoot - Student Mode
          </Typography>
          <Button 
            color="inherit" 
            onClick={onSwitchToTeacher}
            startIcon={<SchoolIcon />}
          >
            Teacher Mode
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Student Stats */}
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #00D084 0%, #10B981 100%)', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'white', color: 'primary.main', mr: 2 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h5">Welcome, Student!</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Ready to practice your vocabulary?
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <EmojiEventsIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4">{studentStats.totalScore}</Typography>
                  <Typography variant="body2">Total Score</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <SportsEsportsIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4">{studentStats.gamesPlayed}</Typography>
                  <Typography variant="body2">Games Played</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <StarIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4">{studentStats.accuracy}%</Typography>
                  <Typography variant="body2">Accuracy</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <LocalFireDepartmentIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4">{studentStats.streak}</Typography>
                  <Typography variant="body2">Win Streak</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Available Games */}
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          Choose Your Vocabulary Challenge
        </Typography>
        
        <Grid container spacing={3}>
          {vocabularySections.map((section, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => setSelectedGame(section)}
              >
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    {section.unitTitle}
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {section.sectionTitle}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Chip 
                      label={`${section.wordCount} words`} 
                      size="small"
                      color="primary"
                    />
                    <Chip 
                      label={section.difficulty} 
                      size="small"
                      color={getDifficultyColor(section.difficulty)}
                    />
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    fullWidth
                    startIcon={<SportsEsportsIcon />}
                    sx={{ 
                      bgcolor: 'secondary.main',
                      '&:hover': {
                        bgcolor: 'secondary.dark',
                      }
                    }}
                  >
                    Play Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {vocabularySections.length === 0 && (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No vocabulary sections found. Ask your teacher to load some content!
            </Typography>
          </Card>
        )}
      </Container>

      {/* Game Modal */}
      {selectedGame && (
        <VocabHoot
          vocabulary={selectedGame.vocabulary}
          onClose={() => setSelectedGame(null)}
          sectionTitle={selectedGame.sectionTitle}
        />
      )}
    </Box>
  );
};

export default StudentDashboard;
