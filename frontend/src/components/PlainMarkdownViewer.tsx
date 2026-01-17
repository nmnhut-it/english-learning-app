import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton, 
  Tooltip,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  InputAdornment,
  Divider,
  LinearProgress,
  Fab,
  Collapse,
  Chip,
  Skeleton
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import TextIncreaseIcon from '@mui/icons-material/TextIncrease';
import TextDecreaseIcon from '@mui/icons-material/TextDecrease';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ArticleIcon from '@mui/icons-material/Article';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import '../styles/print.css';
import '../styles/plain-mode-enhancements.css';

interface PlainMarkdownViewerProps {
  content: string;
  hasHeader?: boolean;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

type ViewMode = 'plain' | 'aided';

// Constants
const MIN_FONT_SIZE = 28;
const DEFAULT_FONT_SIZE = 32;
const MAX_FONT_SIZE = 48;

const PlainMarkdownViewer: React.FC<PlainMarkdownViewerProps> = ({ content, hasHeader = true }) => {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [showTranslations, setShowTranslations] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('aided');
  const [speaking, setSpeaking] = useState<string | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const speechSynthesis = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Extract table of contents
  const toc = useMemo((): TOCItem[] => {
    const headings: TOCItem[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#')) {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2];
          const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
          headings.push({ id, text, level });
        }
      }
    }
    
    return headings;
  }, [content]);
  
  // Preprocess content to handle custom tags and ensure proper markdown parsing
  const preprocessContent = useCallback((rawContent: string): string => {
    // List of custom tags used in voice lectures that need to be stripped
    // These tags wrap markdown content that should be parsed normally
    const customTags = [
      'explanation',
      'answer',
      'questions',
      'task',
      'vocabulary',
      'dialogue',
      'reading',
      'translation',
      'teacher_script',
      'content_table',
      'pronunciation_theory',
      'grammar',
      'audio'
    ];

    let processed = rawContent;

    // Remove custom tags but keep their content
    // This allows ReactMarkdown to properly parse tables and other markdown inside
    customTags.forEach(tag => {
      // Match opening tags with any attributes (e.g., <questions type="multiple_choice">)
      const openTagRegex = new RegExp(`<${tag}[^>]*>`, 'gi');
      // Match closing tags
      const closeTagRegex = new RegExp(`</${tag}>`, 'gi');

      processed = processed.replace(openTagRegex, '');
      processed = processed.replace(closeTagRegex, '');
    });

    // Also remove HTML comments (<!-- chunk: xxx -->)
    processed = processed.replace(/<!--[\s\S]*?-->/g, '');

    return processed;
  }, []);

  // Process content to optionally hide translations
  const processedContent = useMemo(() => {
    // First preprocess to strip custom tags
    let processed = preprocessContent(content);

    if (!showTranslations) {
      // Remove italicized Vietnamese translations
      processed = processed
        .split('\n')
        .filter(line => !line.match(/^\*[^*]+\*$/))
        .join('\n');
    }

    return processed;
  }, [content, showTranslations, preprocessContent]);

  // Speak text using Web Speech API
  const speakText = useCallback((text: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Clean the text to ensure we only speak the English word
    let cleanText = text
      .replace(/\[.*?\]/g, '') // Remove pronunciation guides in brackets
      .replace(/\/[^/]+\//g, '') // Remove IPA pronunciations in slashes
      .replace(/\*.*?\*/g, '') // Remove italicized translations
      .replace(/\([^)]*\)/g, '') // Remove parenthetical notes
      .replace(/[\u0100-\u017F\u1E00-\u1EFF]/g, '') // Remove Latin extended characters (Vietnamese)
      .replace(/[^A-Za-z\s'-]/g, '') // Keep only English letters, spaces, hyphens, and apostrophes
      .trim();
    
    // Handle compound words and phrases
    cleanText = cleanText.replace(/\s+/g, ' '); // Normalize spaces
    
    if (!cleanText) return;
    
    speechSynthesis.current = new SpeechSynthesisUtterance(cleanText);
    speechSynthesis.current.lang = 'en-US';
    speechSynthesis.current.rate = 0.9;
    speechSynthesis.current.pitch = 1;
    speechSynthesis.current.volume = 1;
    
    // Get available voices and prioritize Google male voice
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Priority order for voice selection
      const voicePreferences = [
        // Google voices (male)
        voice => voice.name.includes('Google') && voice.name.includes('Male'),
        voice => voice.name.includes('Google US English Male'),
        voice => voice.name.includes('Google') && voice.lang === 'en-US' && !voice.name.includes('Female'),
        // Any Google English voice
        voice => voice.name.includes('Google') && voice.lang.startsWith('en'),
        // Microsoft male voices
        voice => voice.name.includes('Microsoft') && voice.name.includes('Male') && voice.lang === 'en-US',
        // Any male voice
        voice => voice.name.includes('Male') && voice.lang === 'en-US',
        // Fallback to any US English voice
        voice => voice.lang === 'en-US'
      ];
      
      // Try each preference in order
      for (const preference of voicePreferences) {
        const preferredVoice = voices.find(preference);
        if (preferredVoice) {
          speechSynthesis.current.voice = preferredVoice;
          break;
        }
      }
    };
    
    // Set voice immediately if available, or wait for voices to load
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }
    
    speechSynthesis.current.onstart = () => setSpeaking(text);
    speechSynthesis.current.onend = () => setSpeaking(null);
    speechSynthesis.current.onerror = () => setSpeaking(null);
    
    window.speechSynthesis.speak(speechSynthesis.current);
  }, []);

  // Check if a line is a vocabulary item
  const isVocabularyLine = useCallback((text: string) => {
    // Pattern 1: Starts with bold text (e.g., **word** - definition)
    if (text.match(/^\*\*[^*]+\*\*/)) return true;
    
    // Pattern 2: Contains bold text followed by definition/translation
    if (text.includes('**') && (text.includes(' - ') || text.includes(': '))) return true;
    
    // Pattern 3: Line that contains English word followed by pronunciation or translation
    if (text.match(/^[A-Za-z\s]+\s*[\[\(]/)) return true;
    
    // Pattern 4: Numbered list with word : (part of speech) translation /pronunciation/
    // e.g., "1. build : (v) xây dựng /bɪld/"
    if (text.match(/^\d+\.\s*[A-Za-z][A-Za-z\s]*\s*:/)) return true;
    
    // Pattern 5: Word followed by colon and parentheses (part of speech)
    // e.g., "build : (v)" or "happy : (adj)"
    if (text.match(/^[A-Za-z][A-Za-z\s]*\s*:\s*\([a-z]+\)/)) return true;
    
    // Pattern 6: Bullet point followed by word and colon
    // e.g., "- build : xây dựng" or "• happy : vui vẻ"
    if (text.match(/^[-•●◦▪▸]\s*[A-Za-z][A-Za-z\s]*\s*:/)) return true;
    
    // Pattern 7: Word with phonetic transcription in slashes
    // e.g., "build /bɪld/" or "happy /ˈhæpi/"
    if (text.match(/[A-Za-z]+.*\/[^/]+\//)) return true;
    
    // Pattern 8: Tab or space separated vocabulary (common in vocabulary lists)
    // e.g., "build    xây dựng    /bɪld/"
    if (text.match(/^[A-Za-z][A-Za-z\s]*\s{2,}|\t/)) return true;
    
    return false;
  }, []);

  // Extract vocabulary word from a line
  const extractVocabularyWord = useCallback((text: string) => {
    // Try to extract bold text first
    const boldMatch = text.match(/\*\*([^*]+)\*\*/);
    if (boldMatch) return boldMatch[1];
    
    // Pattern for format: "word/phrase : (part) translation /pronunciation/"
    // This handles multi-word phrases like "come back", "Sunday morning", "Green School Club"
    const colonFormatMatch = text.match(/^([A-Za-z][A-Za-z\s]*?)\s*:\s*\(/);
    if (colonFormatMatch) return colonFormatMatch[1].trim();
    
    // Pattern for numbered list format: "1. build : (v) xây dựng /bɪld/"
    const numberedMatch = text.match(/^\d+\.\s*([A-Za-z][A-Za-z\s]*?)\s*:/);
    if (numberedMatch) return numberedMatch[1].trim();
    
    // Pattern for word with part of speech: "build : (v)"
    const posMatch = text.match(/^([A-Za-z][A-Za-z\s]*?)\s*:\s*\([a-z]+\)/);
    if (posMatch) return posMatch[1].trim();
    
    // Pattern for bullet points: "- build : meaning"
    const bulletMatch = text.match(/^[-•●◦▪▸]\s*([A-Za-z][A-Za-z\s]*?)\s*:/);
    if (bulletMatch) return bulletMatch[1].trim();
    
    // Try to extract text before common delimiters
    const wordMatch = text.match(/^[-•●◦▪▸\d.\s]*([A-Za-z][A-Za-z\s]*?)\s*[:\[\(\-–—]/);
    if (wordMatch) return wordMatch[1].trim();
    
    // Extract word before phonetic transcription
    const phoneticMatch = text.match(/^[-•●◦▪▸\d.\s]*([A-Za-z][A-Za-z\s]*?)\s*\/[^/]+\//);
    if (phoneticMatch) return phoneticMatch[1].trim();
    
    // Extract word from tab/space separated format
    const tabMatch = text.match(/^([A-Za-z][A-Za-z\s]*?)(?:\s{2,}|\t)/);
    if (tabMatch) return tabMatch[1].trim();
    
    // Return the first word(s) that look like English
    const firstWordMatch = text.match(/^[-•●◦▪▸\d.\s]*([A-Za-z][A-Za-z\s]{0,30}?)(?:[^A-Za-z\s]|$)/);
    if (firstWordMatch) return firstWordMatch[1].trim();
    
    // Fallback: clean up and return
    return text.replace(/^[-•●◦▪▸\d.\s]*/, '').split(/[:\[\(\-–—]/)[0].trim();
  }, []);

  // Custom markdown components with forced font sizes
  const markdownComponents = useMemo(() => ({
    h1: ({children}: any) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return <h1 id={id} style={{ fontSize: `${fontSize * 2}px`, fontWeight: 700, margin: '32px 0 24px', color: '#FF5722' }}>{children}</h1>;
    },
    h2: ({children}: any) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return <h2 id={id} style={{ fontSize: `${fontSize * 1.75}px`, fontWeight: 600, margin: '28px 0 20px', color: '#FF5722' }}>{children}</h2>;
    },
    h3: ({children}: any) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return <h3 id={id} style={{ fontSize: `${fontSize * 1.5}px`, fontWeight: 600, margin: '24px 0 16px', color: '#FF5722' }}>{children}</h3>;
    },
    h4: ({children}: any) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return <h4 id={id} style={{ fontSize: `${fontSize * 1.25}px`, fontWeight: 600, margin: '20px 0 12px', color: '#FF5722' }}>{children}</h4>;
    },
    h5: ({children}: any) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return <h5 id={id} style={{ fontSize: `${fontSize * 1.1}px`, fontWeight: 600, margin: '16px 0 8px', color: '#FF5722' }}>{children}</h5>;
    },
    h6: ({children}: any) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      return <h6 id={id} style={{ fontSize: `${fontSize}px`, fontWeight: 600, margin: '16px 0 8px', color: '#FF5722' }}>{children}</h6>;
    },
    p: ({children}: any) => {
      // Function to recursively process children and style IPA and part of speech
      const processChildren = (children: any): any => {
        if (typeof children === 'string') {
          // Pattern to match IPA pronunciation: /.../ 
          const ipaPattern = /(\/[^/]+\/)/g;
          // Pattern to match part of speech: (v), (n), (adj), etc.
          const posPattern = /(\([a-z]+\))/g;
          
          // Split and process the text
          let parts = children.split(/(\([a-z]+\)|\/[^/]+\/)/g);
          
          return parts.map((part, index) => {
            if (part.match(ipaPattern)) {
              return <span key={index} style={{ color: '#4CAF50', fontStyle: 'italic', fontWeight: 500 }}>{part}</span>;
            } else if (part.match(posPattern)) {
              return <span key={index} style={{ color: '#000000', fontStyle: 'italic', fontWeight: 500, fontSize: `${fontSize * 1.1}px` }}>{part}</span>;
            }
            return part;
          });
        }
        
        if (Array.isArray(children)) {
          return children.map((child, index) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { key: index });
            }
            return processChildren(child);
          });
        }
        
        if (React.isValidElement(children) && children.props.children) {
          return React.cloneElement(children as React.ReactElement<any>, {
            children: processChildren(children.props.children)
          });
        }
        
        return children;
      };
      
      const processedChildren = processChildren(children);
      
      // Extract text content from React children
      const extractTextFromChildren = (children: any): string => {
        if (typeof children === 'string') return children;
        if (Array.isArray(children)) {
          return children.map(child => extractTextFromChildren(child)).join('');
        }
        if (children?.props?.children) {
          return extractTextFromChildren(children.props.children);
        }
        return String(children || '');
      };
      
      const text = extractTextFromChildren(children);
      const shouldShowSpeaker = viewMode === 'aided' && isVocabularyLine(text);
      
      if (shouldShowSpeaker) {
        const word = extractVocabularyWord(text);
        return (
          <p style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: 1.8, 
            margin: '16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
          onClick={() => speakText(word)}
          >
            <span style={{ flex: 1 }}>{processedChildren}</span>
            <span style={{ 
              fontSize: `${fontSize * 0.6}px`,
              color: speaking === word ? '#FF5722' : '#666',
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              userSelect: 'none'
            }}>
              {speaking === word ? 'speaking...' : 'click to pronounce'}
            </span>
          </p>
        );
      }
      
      return <p style={{ fontSize: `${fontSize}px`, lineHeight: 1.8, margin: '16px 0' }}>{processedChildren}</p>;
    },
    li: ({children}: any) => {
      // Function to recursively process children and style IPA and part of speech
      const processChildren = (children: any): any => {
        if (typeof children === 'string') {
          // Pattern to match IPA pronunciation: /.../ 
          const ipaPattern = /(\/[^/]+\/)/g;
          // Pattern to match part of speech: (v), (n), (adj), etc.
          const posPattern = /(\([a-z]+\))/g;
          
          // Split and process the text
          let parts = children.split(/(\([a-z]+\)|\/[^/]+\/)/g);
          
          return parts.map((part, index) => {
            if (part.match(ipaPattern)) {
              return <span key={index} style={{ color: '#4CAF50', fontStyle: 'italic', fontWeight: 500 }}>{part}</span>;
            } else if (part.match(posPattern)) {
              return <span key={index} style={{ color: '#000000', fontStyle: 'italic', fontWeight: 500, fontSize: `${fontSize * 1.1}px` }}>{part}</span>;
            }
            return part;
          });
        }
        
        if (Array.isArray(children)) {
          return children.map((child, index) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { key: index });
            }
            return processChildren(child);
          });
        }
        
        if (React.isValidElement(children) && children.props.children) {
          return React.cloneElement(children as React.ReactElement<any>, {
            children: processChildren(children.props.children)
          });
        }
        
        return children;
      };
      
      const processedChildren = processChildren(children);
      
      // Extract text content from React children
      const extractTextFromChildren = (children: any): string => {
        if (typeof children === 'string') return children;
        if (Array.isArray(children)) {
          return children.map(child => extractTextFromChildren(child)).join('');
        }
        if (children?.props?.children) {
          return extractTextFromChildren(children.props.children);
        }
        return String(children || '');
      };
      
      const text = extractTextFromChildren(children);
      const shouldShowSpeaker = viewMode === 'aided' && isVocabularyLine(text);
      
      if (shouldShowSpeaker) {
        const word = extractVocabularyWord(text);
        return (
          <li style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: 1.8, 
            margin: '8px 0',
            cursor: 'pointer'
          }}
          onClick={() => speakText(word)}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              width: '100%'
            }}>
              <span style={{ flex: 1 }}>{processedChildren}</span>
              <span style={{ 
                fontSize: `${fontSize * 0.6}px`,
                color: speaking === word ? '#FF5722' : '#666',
                fontStyle: 'italic',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                marginTop: '2px'
              }}>
                {speaking === word ? 'speaking...' : 'click to pronounce'}
              </span>
            </div>
          </li>
        );
      }
      
      return <li style={{ fontSize: `${fontSize}px`, lineHeight: 1.8, margin: '8px 0' }}>{processedChildren}</li>;
    },
    ul: ({children}: any) => <ul style={{ fontSize: `${fontSize}px`, paddingLeft: '32px', margin: '16px 0' }}>{children}</ul>,
    ol: ({children}: any) => <ol style={{ fontSize: `${fontSize}px`, paddingLeft: '32px', margin: '16px 0' }}>{children}</ol>,
    blockquote: ({children}: any) => <blockquote style={{ fontSize: `${fontSize}px`, margin: '24px 0', paddingLeft: '24px' }}>{children}</blockquote>,
    table: ({children}: any) => (
      <table style={{
        fontSize: `${fontSize}px`,
        width: '100%',
        margin: '24px 0',
        borderCollapse: 'collapse',
        border: '2px solid #E0E0E0',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        {children}
      </table>
    ),
    thead: ({children}: any) => (
      <thead style={{
        backgroundColor: '#FFE0B2',
        borderBottom: '2px solid #FF5722',
      }}>
        {children}
      </thead>
    ),
    tbody: ({children}: any) => <tbody>{children}</tbody>,
    tr: ({children}: any) => (
      <tr style={{
        borderBottom: '1px solid #E0E0E0',
      }}>
        {children}
      </tr>
    ),
    th: ({children}: any) => (
      <th style={{
        fontSize: `${Math.max(fontSize * 0.95, 28)}px`,
        padding: '12px 16px',
        textAlign: 'left',
        fontWeight: 700,
        color: '#333333',
        borderRight: '1px solid #E0E0E0',
      }}>
        {children}
      </th>
    ),
    td: ({children}: any) => (
      <td style={{
        fontSize: `${Math.max(fontSize * 0.95, 28)}px`,
        padding: '12px 16px',
        borderRight: '1px solid #E0E0E0',
        lineHeight: 1.6,
      }}>
        {children}
      </td>
    ),
    code: ({children}: any) => <code style={{ fontSize: `${Math.max(fontSize * 0.9, 28)}px`, padding: '2px 6px' }}>{children}</code>,
    pre: ({children}: any) => <pre style={{ fontSize: `${Math.max(fontSize * 0.9, 28)}px`, padding: '20px', margin: '24px 0', overflow: 'auto' }}>{children}</pre>,
    em: ({children}: any) => <em style={{ fontSize: 'inherit', fontStyle: 'italic', display: showTranslations ? 'inline' : 'none' }}>{children}</em>,
    strong: ({children}: any) => <strong style={{ fontSize: 'inherit', fontWeight: 700, color: '#FF5722' }}>{children}</strong>,
    a: ({children, href}: any) => <a href={href} style={{ fontSize: 'inherit', color: '#FF5722' }}>{children}</a>,
  }), [fontSize, showTranslations, viewMode, isVocabularyLine, extractVocabularyWord, speakText, speaking]);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setScrollProgress(progress);
        setShowScrollTop(scrollTop > 300);
      }
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Preload voices on mount
  useEffect(() => {
    // Force load voices
    window.speechSynthesis.getVoices();
    
    // Some browsers need this event to load voices
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    
    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            setSearchOpen(true);
            setTimeout(() => searchRef.current?.focus(), 100);
            break;
          case 'p':
            e.preventDefault();
            handlePrint();
            break;
          case '=':
          case '+':
            e.preventDefault();
            increaseFontSize();
            break;
          case '-':
            e.preventDefault();
            decreaseFontSize();
            break;
        }
      } else if (e.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false);
          setSearchQuery('');
        }
        if (speaking) {
          window.speechSynthesis.cancel();
          setSpeaking(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [searchOpen, speaking]);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, MAX_FONT_SIZE));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, MIN_FONT_SIZE));
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element && contentRef.current) {
      const offsetTop = element.offsetTop - 100;
      contentRef.current.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
    setTocOpen(false);
  };

  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Search functionality
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const matches = processedContent.toLowerCase().includes(query.toLowerCase());
      setSearchResults(matches ? 1 : 0);
    } else {
      setSearchResults(0);
    }
  }, [processedContent]);

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      {/* Progress Bar */}
      <LinearProgress 
        variant="determinate" 
        value={scrollProgress} 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 900, // Lower than header
        }}
      />

      {/* Search Bar */}
      <Collapse in={searchOpen}>
        <Paper 
          sx={{ 
            position: 'fixed',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            p: 1,
            zIndex: 950, // Lower than header controls
            minWidth: 400,
            boxShadow: 4
          }}
        >
          <TextField
            inputRef={searchRef}
            fullWidth
            size="small"
            placeholder="Search in document..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              sx: { fontSize: `${MIN_FONT_SIZE}px` },
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {searchResults > 0 && (
                    <Chip 
                      size="small" 
                      label={`Found`}
                      sx={{ mr: 1, fontSize: `${MIN_FONT_SIZE * 0.8}px` }}
                    />
                  )}
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Paper>
      </Collapse>

      {/* Control Panel */}
      <Paper 
        sx={{ 
          position: 'fixed',
          top: hasHeader ? 80 : 20,
          right: 20,
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 900, // Lower than header
          boxShadow: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'top 0.3s ease',
        }}
      >
        {/* View Mode Toggle */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
          orientation="vertical"
          size="small"
        >
          <ToggleButton value="plain">
            <Tooltip title="Plain View">
              <ArticleIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="aided">
            <Tooltip title="Aided View (with pronunciation)">
              <RecordVoiceOverIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
        <Divider />
        <Tooltip title="Table of Contents">
          <IconButton onClick={() => setTocOpen(!tocOpen)} size="large">
            <MenuIcon fontSize="large" />
          </IconButton>
        </Tooltip>
        <Divider />
        <Tooltip title="Search (Ctrl+F)">
          <IconButton onClick={() => setSearchOpen(!searchOpen)} size="large">
            <SearchIcon fontSize="large" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Print (Ctrl+P)">
          <IconButton onClick={handlePrint} size="large">
            <PrintIcon fontSize="large" />
          </IconButton>
        </Tooltip>
        <Divider />
        <Tooltip title="Increase font size (Ctrl++)">
          <IconButton onClick={increaseFontSize} size="large">
            <TextIncreaseIcon fontSize="large" />
          </IconButton>
        </Tooltip>
        <Typography align="center" sx={{ fontSize: `${MIN_FONT_SIZE * 0.8}px`, fontWeight: 'bold' }}>
          {fontSize}px
        </Typography>
        <Tooltip title="Decrease font size (Ctrl+-)">
          <IconButton onClick={decreaseFontSize} size="large">
            <TextDecreaseIcon fontSize="large" />
          </IconButton>
        </Tooltip>
        <Tooltip title={showTranslations ? "Hide translations" : "Show translations"}>
          <IconButton 
            onClick={() => setShowTranslations(!showTranslations)} 
            size="large"
            color={showTranslations ? "primary" : "default"}
          >
            <SwapVertIcon fontSize="large" />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Table of Contents Drawer */}
      <Drawer
        anchor="left"
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 350,
            top: 64,
            height: 'calc(100% - 64px)'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ fontSize: `${fontSize}px` }}>
            Table of Contents
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {toc.map((item) => (
              <ListItemButton 
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                sx={{ 
                  pl: (item.level - 1) * 2,
                  py: 1
                }}
              >
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: item.level <= 2 ? `${fontSize * 0.9}px` : `${fontSize * 0.8}px`,
                    fontWeight: item.level === 1 ? 600 : item.level === 2 ? 500 : 400
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Fab
          size="large"
          color="primary"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 900, // Lower than header
          }}
        >
          <KeyboardArrowUpIcon fontSize="large" />
        </Fab>
      )}

      {/* Markdown Content - Simple scrollable container */}
      <Box
        ref={contentRef}
        className="plain-mode-content" 
        sx={{ 
          height: '100%',
          overflow: 'auto',
          fontSize: `${fontSize}px`,
          '& > div': {
            maxWidth: 1400, 
            mx: 'auto', 
            p: { xs: 2, sm: 4 },
          }
        }}
      >
        <div style={{ fontSize: `${fontSize}px` }}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      </Box>
    </Box>
  );
};

export default PlainMarkdownViewer;