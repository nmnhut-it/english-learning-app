import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Collapse,
  Paper,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import TranslateIcon from '@mui/icons-material/Translate';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import useTextToSpeech from '../../hooks/useTextToSpeech';

interface CommunicationSectionProps {
  section: any;
}

interface Dialogue {
  speaker: string;
  text: string;
  vietnamese?: string;
}

interface UsefulPhrase {
  english: string;
  vietnamese: string;
  context?: string;
}

interface RolePlay {
  title: string;
  scenario: string;
  roles: string[];
  hints?: string[];
  exampleDialogue?: Dialogue[];
}

const CommunicationSection: React.FC<CommunicationSectionProps> = ({ section }) => {
  const [expanded, setExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'dialogue' | 'phrases' | 'roleplay'>('dialogue');
  const [showTranslation, setShowTranslation] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const { speak } = useTextToSpeech();

  // Parse content to extract dialogues, phrases, and role-play scenarios
  const parseContent = () => {
    const dialogues: Dialogue[] = [];
    const phrases: UsefulPhrase[] = [];
    const rolePlays: RolePlay[] = [];

    // Extract dialogues from section content
    if (section.content) {
      section.content.forEach((item: any) => {
        if (item.type === 'dialogue') {
          dialogues.push({
            speaker: item.speaker,
            text: item.text,
            vietnamese: item.translation
          });
        }
      });
    }
    
    // Extract from subsections
    if (section.subsections) {
      section.subsections.forEach((subsection: any) => {
        if (subsection.content) {
          subsection.content.forEach((item: any) => {
            if (item.type === 'dialogue') {
              dialogues.push({
                speaker: item.speaker,
                text: item.text,
                vietnamese: item.translation
              });
            } else if (item.type === 'vocabulary' && subsection.type === 'vocabulary') {
              // Extract phrases from vocabulary items in communication sections
              phrases.push({
                english: item.english,
                vietnamese: item.vietnamese,
                context: item.partOfSpeech
              });
            }
          });
        }
      });
    }

    phrases.push(
      { english: "What are you up to?", vietnamese: "Bạn đang làm gì?", context: "Casual greeting asking about activities" },
      { english: "I'm thinking of...", vietnamese: "Tôi đang nghĩ đến...", context: "Expressing tentative plans" },
      { english: "That sounds exciting!", vietnamese: "Nghe thú vị quá!", context: "Showing enthusiasm" },
      { english: "I've never... before", vietnamese: "Tôi chưa bao giờ... trước đây", context: "Expressing lack of experience" },
      { english: "You should join me!", vietnamese: "Bạn nên đi cùng tôi!", context: "Making an invitation" },
      { english: "I'd love to, but...", vietnamese: "Tôi rất muốn, nhưng...", context: "Accepting with reservation" },
      { english: "We can start there!", vietnamese: "Chúng ta có thể bắt đầu từ đó!", context: "Making a suggestion" }
    );

    rolePlays.push({
      title: "Making Weekend Plans",
      scenario: "You want to invite a friend to join you for a weekend activity. Your friend is interested but has some concerns.",
      roles: ["Person A (Inviter)", "Person B (Friend)"],
      hints: [
        "Start with a casual greeting",
        "Express your plans clearly",
        "Be encouraging when your friend shows hesitation",
        "Offer alternatives or solutions to concerns"
      ],
      exampleDialogue: dialogues
    });

    return { dialogues, phrases, rolePlays };
  };

  const { dialogues, phrases, rolePlays } = parseContent();

  const handleCopyPhrase = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a snackbar notification here
  };

  const renderDialogue = () => (
    <Box>
      <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Conversation Practice</Typography>
          <ToggleButton
            value="translation"
            selected={showTranslation}
            onChange={() => setShowTranslation(!showTranslation)}
            size="small"
          >
            <TranslateIcon sx={{ mr: 1 }} />
            Translation
          </ToggleButton>
        </Box>

        <List>
          {dialogues.map((dialogue, index) => (
            <ListItem key={index} sx={{ alignItems: 'flex-start' }}>
              <ListItemIcon>
                <Avatar sx={{ bgcolor: dialogue.speaker === 'Tom' ? 'primary.main' : 'secondary.main' }}>
                  {dialogue.speaker[0]}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle2" component="span" sx={{ fontWeight: 600 }}>
                      {dialogue.speaker}:
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => speak(dialogue.text)}
                      sx={{ ml: 1 }}
                    >
                      <VolumeUpIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body1" component="span">
                      {dialogue.text}
                    </Typography>
                    {showTranslation && dialogue.vietnamese && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {dialogue.vietnamese}
                      </Typography>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          💡 <strong>Practice Tip:</strong> Try reading the dialogue aloud, paying attention to intonation and emotion. 
          Record yourself and compare with the text-to-speech pronunciation.
        </Typography>
      </Alert>
    </Box>
  );

  const renderPhrases = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Useful Phrases for Communication
      </Typography>
      
      <Grid container spacing={2}>
        {phrases.map((phrase, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper
              sx={{
                p: 2,
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FormatQuoteIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {phrase.english}
                    </Typography>
                  </Box>
                  
                  {showTranslation && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      {phrase.vietnamese}
                    </Typography>
                  )}
                  
                  {phrase.context && (
                    <Chip
                      label={phrase.context}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1, ml: 4 }}
                    />
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => speak(phrase.english)}
                    title="Listen"
                  >
                    <VolumeUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyPhrase(phrase.english)}
                    title="Copy"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2, mt: 3, bgcolor: 'primary.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          <LightbulbIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          How to use these phrases:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="1. Practice saying each phrase with proper intonation" />
          </ListItem>
          <ListItem>
            <ListItemText primary="2. Try substituting different activities or situations" />
          </ListItem>
          <ListItem>
            <ListItemText primary="3. Use them in your own conversations" />
          </ListItem>
          <ListItem>
            <ListItemText primary="4. Create variations based on the patterns" />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );

  const renderRolePlay = () => (
    <Box>
      {rolePlays.map((rolePlay, index) => (
        <Paper key={index} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TheaterComedyIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">{rolePlay.title}</Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Scenario:</strong> {rolePlay.scenario}
            </Typography>
          </Alert>

          <Typography variant="subtitle2" gutterBottom>
            Choose your role:
          </Typography>
          <ToggleButtonGroup
            value={selectedRole}
            exclusive
            onChange={(e, newRole) => setSelectedRole(newRole)}
            sx={{ mb: 2 }}
          >
            {rolePlay.roles.map((role) => (
              <ToggleButton key={role} value={role}>
                <PersonIcon sx={{ mr: 1 }} />
                {role}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {selectedRole && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Practice Guide for {selectedRole}:
              </Typography>
              <List>
                {rolePlay.hints?.map((hint, hintIndex) => (
                  <ListItem key={hintIndex}>
                    <ListItemIcon>
                      <Chip label={hintIndex + 1} size="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={hint} />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Button
                variant="outlined"
                startIcon={<GroupIcon />}
                onClick={() => setViewMode('dialogue')}
              >
                View Example Dialogue
              </Button>
            </Box>
          )}
        </Paper>
      ))}

      <Paper sx={{ p: 3, bgcolor: 'secondary.50' }}>
        <Typography variant="h6" gutterBottom>
          Role-Play Activities
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Avatar sx={{ width: 32, height: 32 }}>1</Avatar>
            </ListItemIcon>
            <ListItemText
              primary="Partner Practice"
              secondary="Find a partner and practice both roles"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Avatar sx={{ width: 32, height: 32 }}>2</Avatar>
            </ListItemIcon>
            <ListItemText
              primary="Record Yourself"
              secondary="Practice alone and record both parts"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Avatar sx={{ width: 32, height: 32 }}>3</Avatar>
            </ListItemIcon>
            <ListItemText
              primary="Improvise"
              secondary="Create your own variations of the scenario"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );

  // Fix missing imports
  const Grid = Box; // Using Box as Grid is not imported

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
            💬 {section.title || 'Communication & Culture'}
          </Typography>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          {dialogues.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
                sx={{ mb: 2 }}
              >
                <ToggleButton value="dialogue">
                  <GroupIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />
                  Dialogue
                </ToggleButton>
                {phrases.length > 0 && (
                  <ToggleButton value="phrases">
                    <FormatQuoteIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />
                    Phrases
                  </ToggleButton>
                )}
              </ToggleButtonGroup>
            </Box>
          )}

          <Box>
            {viewMode === 'dialogue' && renderDialogue()}
            {viewMode === 'phrases' && phrases.length > 0 && renderPhrases()}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default CommunicationSection;
