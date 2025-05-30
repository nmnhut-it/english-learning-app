import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Collapse,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import MicIcon from '@mui/icons-material/Mic';
import CreateIcon from '@mui/icons-material/Create';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import useTextToSpeech from '../../hooks/useTextToSpeech';

interface SkillsSectionProps {
  section: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`skills-tabpanel-${index}`}
      aria-labelledby={`skills-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const SkillsSection: React.FC<SkillsSectionProps> = ({ section }) => {
  const [expanded, setExpanded] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const { speak } = useTextToSpeech();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleTaskComplete = (taskId: string) => {
    setCompletedTasks({
      ...completedTasks,
      [taskId]: !completedTasks[taskId]
    });
  };

  // Parse content for each skill
  const parseSkillContent = (skillType: string) => {
    // This would normally parse the actual content from section.content
    // For now, returning sample content
    switch (skillType) {
      case 'reading':
        return {
          title: 'Reading Comprehension',
          passages: [
            {
              id: 'passage1',
              title: 'The Benefits of Leisure Activities',
              content: `Leisure activities play a crucial role in maintaining a healthy work-life balance. 
                       Whether it's reading a book, playing sports, or pursuing creative hobbies, 
                       these activities help reduce stress and improve overall well-being. 
                       Studies have shown that people who regularly engage in leisure activities 
                       report higher levels of life satisfaction and better mental health.`,
              questions: [
                'What is the main topic of this passage?',
                'According to the passage, what are the benefits of leisure activities?',
                'Why is work-life balance important?'
              ],
              vocabulary: ['leisure', 'crucial', 'well-being', 'satisfaction']
            }
          ],
          tasks: [
            { id: 'task1', description: 'Read the passage carefully' },
            { id: 'task2', description: 'Identify the main idea' },
            { id: 'task3', description: 'Answer comprehension questions' },
            { id: 'task4', description: 'Learn new vocabulary' }
          ]
        };

      case 'listening':
        return {
          title: 'Listening Practice',
          audioTracks: [
            {
              id: 'audio1',
              title: 'Conversation about Weekend Plans',
              duration: '2:30',
              transcript: `Tom: What are your plans for the weekend?
                          Sarah: I'm thinking of going hiking. The weather forecast looks great.
                          Tom: That sounds fun! Which trail are you planning to take?
                          Sarah: The Mountain View trail. It's about a 3-hour hike.`,
              questions: [
                'What is Sarah planning to do?',
                'Why did she choose this activity?',
                'How long will the hike take?'
              ]
            }
          ],
          tasks: [
            { id: 'task1', description: 'Listen to the audio without reading' },
            { id: 'task2', description: 'Take notes while listening' },
            { id: 'task3', description: 'Answer comprehension questions' },
            { id: 'task4', description: 'Practice pronunciation' }
          ]
        };

      case 'speaking':
        return {
          title: 'Speaking Practice',
          topics: [
            {
              id: 'topic1',
              title: 'Describe Your Favorite Hobby',
              prompts: [
                'What is your favorite hobby?',
                'How often do you do it?',
                'Why do you enjoy it?',
                'Would you recommend it to others?'
              ],
              usefulPhrases: [
                'In my free time, I enjoy...',
                'I find it relaxing because...',
                'What I like most about it is...',
                'I would definitely recommend it because...'
              ]
            }
          ],
          tasks: [
            { id: 'task1', description: 'Prepare your ideas (1 minute)' },
            { id: 'task2', description: 'Speak for 2 minutes' },
            { id: 'task3', description: 'Use at least 3 useful phrases' },
            { id: 'task4', description: 'Record yourself and listen back' }
          ]
        };

      case 'writing':
        return {
          title: 'Writing Exercise',
          prompts: [
            {
              id: 'prompt1',
              title: 'Email to a Friend',
              task: 'Write an email to a friend inviting them to join you for a weekend activity.',
              requirements: [
                'Use informal language',
                'Include: greeting, invitation, details, closing',
                'Write 100-150 words',
                'Use present continuous for future plans'
              ],
              sample: `Hi James,
                      
                      I hope you're doing well! I'm planning to go to the new escape room downtown 
                      this Saturday afternoon. Would you like to join me? 
                      
                      It starts at 2 PM and should take about an hour. We could grab coffee afterwards 
                      if you're free. Let me know if you can make it!
                      
                      Best,
                      Sarah`
            }
          ],
          tasks: [
            { id: 'task1', description: 'Plan your email structure' },
            { id: 'task2', description: 'Write a first draft' },
            { id: 'task3', description: 'Check grammar and spelling' },
            { id: 'task4', description: 'Review and improve' }
          ]
        };

      default:
        return null;
    }
  };

  const renderReading = () => {
    const content = parseSkillContent('reading');
    if (!content) return null;

    return (
      <Box>
        {content.passages.map((passage) => (
          <Paper key={passage.id} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {passage.title}
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              {passage.content}
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Vocabulary to Learn:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                {passage.vocabulary.map((word) => (
                  <Chip
                    key={word}
                    label={word}
                    onClick={() => speak(word)}
                    icon={<VolumeUpIcon />}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Comprehension Questions:
            </Typography>
            <List>
              {passage.questions.map((question, index) => (
                <ListItem key={index}>
                  <ListItemText primary={`${index + 1}. ${question}`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        ))}

        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" gutterBottom>
            Reading Tasks:
          </Typography>
          <List dense>
            {content.tasks.map((task) => (
              <ListItem key={task.id}>
                <ListItemIcon>
                  <Checkbox
                    checked={completedTasks[task.id] || false}
                    onClick={() => toggleTaskComplete(task.id)}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={task.description}
                  sx={{ 
                    textDecoration: completedTasks[task.id] ? 'line-through' : 'none',
                    color: completedTasks[task.id] ? 'text.secondary' : 'text.primary'
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    );
  };

  const renderListening = () => {
    const content = parseSkillContent('listening');
    if (!content) return null;

    return (
      <Box>
        {content.audioTracks.map((track) => (
          <Paper key={track.id} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <HeadphonesIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                {track.title}
              </Typography>
              <Chip label={track.duration} size="small" sx={{ ml: 2 }} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={() => speak(track.transcript)}
              >
                Play Audio
              </Button>
              <Button variant="outlined">
                Show Transcript
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Click "Play Audio" to hear the conversation. Try to understand without looking at the transcript first.
              </Typography>
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              Questions:
            </Typography>
            <List>
              {track.questions.map((question, index) => (
                <ListItem key={index}>
                  <ListItemText primary={`${index + 1}. ${question}`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        ))}

        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" gutterBottom>
            Listening Tasks:
          </Typography>
          <List dense>
            {content.tasks.map((task) => (
              <ListItem key={task.id}>
                <ListItemIcon>
                  <Checkbox
                    checked={completedTasks[task.id] || false}
                    onClick={() => toggleTaskComplete(task.id)}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={task.description}
                  sx={{ 
                    textDecoration: completedTasks[task.id] ? 'line-through' : 'none',
                    color: completedTasks[task.id] ? 'text.secondary' : 'text.primary'
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    );
  };

  const renderSpeaking = () => {
    const content = parseSkillContent('speaking');
    if (!content) return null;

    return (
      <Box>
        {content.topics.map((topic) => (
          <Paper key={topic.id} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MicIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                {topic.title}
              </Typography>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Speaking Prompts:
            </Typography>
            <List>
              {topic.prompts.map((prompt, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Chip label={index + 1} size="small" />
                  </ListItemIcon>
                  <ListItemText primary={prompt} />
                </ListItem>
              ))}
            </List>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Useful Phrases:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
                {topic.usefulPhrases.map((phrase, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      "{phrase}"
                    </Typography>
                    <IconButton size="small" onClick={() => speak(phrase)} sx={{ ml: 1 }}>
                      <VolumeUpIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Paper>
            </Box>
          </Paper>
        ))}

        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" gutterBottom>
            Speaking Tasks:
          </Typography>
          <List dense>
            {content.tasks.map((task) => (
              <ListItem key={task.id}>
                <ListItemIcon>
                  <Checkbox
                    checked={completedTasks[task.id] || false}
                    onClick={() => toggleTaskComplete(task.id)}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={task.description}
                  sx={{ 
                    textDecoration: completedTasks[task.id] ? 'line-through' : 'none',
                    color: completedTasks[task.id] ? 'text.secondary' : 'text.primary'
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    );
  };

  const renderWriting = () => {
    const content = parseSkillContent('writing');
    if (!content) return null;

    return (
      <Box>
        {content.prompts.map((prompt) => (
          <Paper key={prompt.id} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CreateIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                {prompt.title}
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {prompt.task}
              </Typography>
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              Requirements:
            </Typography>
            <List dense>
              {prompt.requirements.map((req, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={req} />
                </ListItem>
              ))}
            </List>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Sample Answer:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontFamily: 'monospace' }}>
                  {prompt.sample}
                </Typography>
              </Paper>
            </Box>
          </Paper>
        ))}

        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" gutterBottom>
            Writing Tasks:
          </Typography>
          <List dense>
            {content.tasks.map((task) => (
              <ListItem key={task.id}>
                <ListItemIcon>
                  <Checkbox
                    checked={completedTasks[task.id] || false}
                    onClick={() => toggleTaskComplete(task.id)}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={task.description}
                  sx={{ 
                    textDecoration: completedTasks[task.id] ? 'line-through' : 'none',
                    color: completedTasks[task.id] ? 'text.secondary' : 'text.primary'
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    );
  };

  // Fix the Checkbox import issue
  const Checkbox: React.FC<{ checked: boolean; onClick: () => void }> = ({ checked, onClick }) => (
    <IconButton size="small" onClick={onClick}>
      <CheckCircleIcon color={checked ? "primary" : "disabled"} />
    </IconButton>
  );

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" component="h3" sx={{ fontWeight: 500 }}>
            📖 {section.title || 'Skills Practice'}
          </Typography>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="skills tabs">
              <Tab icon={<MenuBookIcon />} label="Reading" />
              <Tab icon={<HeadphonesIcon />} label="Listening" />
              <Tab icon={<MicIcon />} label="Speaking" />
              <Tab icon={<CreateIcon />} label="Writing" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {renderReading()}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {renderListening()}
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            {renderSpeaking()}
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            {renderWriting()}
          </TabPanel>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SkillsSection;
