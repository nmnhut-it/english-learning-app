import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import translationService from './translationService';

interface QuizVocabularyItem {
  word: string;
  ipa: string;
  meaning: string;
}

interface QuizSession {
  id: string;
  grade?: number;
  period?: string;
  date?: string;
  vocabulary: QuizVocabularyItem[];
  metadata: {
    createdAt: string;
    vocabCount: number;
    source: string;
    lessons?: string[];
  };
  results?: {
    completedAt?: string;
    score?: number;
    mode?: string;
  }[];
}

class QuizService {
  private sessionsDir: string;
  private sessionsFile: string;

  constructor() {
    this.sessionsDir = path.join(process.cwd(), 'data', 'quiz-sessions');
    this.sessionsFile = path.join(this.sessionsDir, 'sessions.json');
    this.initializeStorage();
  }

  private initializeStorage() {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
    if (!fs.existsSync(this.sessionsFile)) {
      fs.writeFileSync(this.sessionsFile, '{}');
    }
  }

  private loadSessions(): Record<string, QuizSession> {
    try {
      const data = fs.readFileSync(this.sessionsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading quiz sessions:', error);
      return {};
    }
  }

  private saveSessions(sessions: Record<string, QuizSession>) {
    try {
      fs.writeFileSync(this.sessionsFile, JSON.stringify(sessions, null, 2));
    } catch (error) {
      console.error('Error saving quiz sessions:', error);
    }
  }

  // Transform vocabulary from export format to quiz format
  private transformToQuizFormat(vocabulary: any[]): QuizVocabularyItem[] {
    return vocabulary.map(item => ({
      word: item.word,
      ipa: item.pronunciation ? `/${item.pronunciation}/` : '',
      meaning: item.meaning
    }));
  }

  // Prepare a quiz session based on criteria
  async prepareQuizSession(grade?: number, period?: string, date?: string): Promise<{ sessionId: string; vocabCount: number }> {
    const sessionId = uuidv4();
    let vocabulary: any[] = [];
    let lessonsList: string[] = [];

    try {
      // Get vocabulary based on criteria
      if (period === 'today') {
        if (grade) {
          const today = new Date().toISOString().split('T')[0];
          const exports = await translationService.getVocabularyByDateAndGrade(today, grade);
          exports.forEach(exp => {
            vocabulary.push(...exp.vocabulary);
            lessonsList.push(`Unit ${exp.metadata.unit} - ${exp.metadata.lesson}`);
          });
        } else {
          vocabulary = await translationService.getVocabularyToday();
        }
      } else if (period === 'this-week' && grade) {
        const exports = await translationService.getVocabularyThisWeekByGrade(grade);
        exports.forEach(exp => {
          vocabulary.push(...exp.vocabulary);
          lessonsList.push(`Unit ${exp.metadata.unit} - ${exp.metadata.lesson}`);
        });
      } else if (period === 'last-week') {
        if (grade) {
          // Get last week's vocabulary for specific grade
          const lastWeekExports = await translationService.getVocabularyLastWeek();
          const filteredExports = lastWeekExports.filter(exp => exp.metadata.grade === grade);
          filteredExports.forEach(exp => {
            vocabulary.push(...exp.vocabulary);
            lessonsList.push(`Unit ${exp.metadata.unit} - ${exp.metadata.lesson}`);
          });
        } else {
          const exports = await translationService.getVocabularyLastWeek();
          exports.forEach(exp => {
            vocabulary.push(...exp.vocabulary);
            lessonsList.push(`Unit ${exp.metadata.unit} - ${exp.metadata.lesson}`);
          });
        }
      } else if (period === 'this-month' && grade) {
        const exports = await translationService.getVocabularyThisMonthByGrade(grade);
        exports.forEach(exp => {
          vocabulary.push(...exp.vocabulary);
          lessonsList.push(`Unit ${exp.metadata.unit} - ${exp.metadata.lesson}`);
        });
      } else if (date) {
        if (grade) {
          const exports = await translationService.getVocabularyByDateAndGrade(date, grade);
          exports.forEach(exp => {
            vocabulary.push(...exp.vocabulary);
            lessonsList.push(`Unit ${exp.metadata.unit} - ${exp.metadata.lesson}`);
          });
        } else {
          vocabulary = await translationService.getVocabularyByDate(date);
        }
      }

      // Remove duplicates based on word
      const uniqueVocab = Array.from(
        new Map(vocabulary.map(item => [item.word.toLowerCase(), item])).values()
      );

      // Transform to quiz format
      const quizVocabulary = this.transformToQuizFormat(uniqueVocab);

      // Create session
      const session: QuizSession = {
        id: sessionId,
        grade,
        period,
        date,
        vocabulary: quizVocabulary,
        metadata: {
          createdAt: new Date().toISOString(),
          vocabCount: quizVocabulary.length,
          source: `Grade ${grade || 'All'} - ${period || date || 'Custom'}`,
          lessons: [...new Set(lessonsList)]
        },
        results: []
      };

      // Save session
      const sessions = this.loadSessions();
      sessions[sessionId] = session;
      this.saveSessions(sessions);

      // Also save individual session file for quick access
      const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
      fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

      return {
        sessionId,
        vocabCount: quizVocabulary.length
      };
    } catch (error) {
      console.error('Error preparing quiz session:', error);
      throw error;
    }
  }

  // Get a quiz session by ID
  getQuizSession(sessionId: string): QuizSession | null {
    try {
      // Try to load from individual file first (faster)
      const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
      if (fs.existsSync(sessionFile)) {
        const data = fs.readFileSync(sessionFile, 'utf-8');
        return JSON.parse(data);
      }

      // Fallback to main sessions file
      const sessions = this.loadSessions();
      return sessions[sessionId] || null;
    } catch (error) {
      console.error('Error getting quiz session:', error);
      return null;
    }
  }

  // Save quiz results
  saveQuizResults(sessionId: string, results: any): boolean {
    try {
      const session = this.getQuizSession(sessionId);
      if (!session) return false;

      // Add results to session
      if (!session.results) session.results = [];
      session.results.push({
        completedAt: new Date().toISOString(),
        ...results
      });

      // Save updated session
      const sessions = this.loadSessions();
      sessions[sessionId] = session;
      this.saveSessions(sessions);

      // Update individual file
      const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
      fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

      return true;
    } catch (error) {
      console.error('Error saving quiz results:', error);
      return false;
    }
  }

  // Get recent quiz sessions
  getRecentSessions(limit: number = 10): QuizSession[] {
    try {
      const sessions = this.loadSessions();
      return Object.values(sessions)
        .sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      return [];
    }
  }

  // Prepare quiz from specific lesson
  async prepareQuizFromLesson(grade: number, book: string, unit: number, lesson: string): Promise<{ sessionId: string; vocabCount: number }> {
    const sessionId = uuidv4();

    try {
      const lessonVocab = await translationService.getVocabularyByLesson(grade, book, unit, lesson);
      
      if (!lessonVocab) {
        throw new Error('No vocabulary found for this lesson');
      }

      // Transform to quiz format
      const quizVocabulary = this.transformToQuizFormat(lessonVocab.vocabulary);

      // Create session
      const session: QuizSession = {
        id: sessionId,
        grade,
        vocabulary: quizVocabulary,
        metadata: {
          createdAt: new Date().toISOString(),
          vocabCount: quizVocabulary.length,
          source: `Grade ${grade} - ${book} - Unit ${unit} - ${lesson}`,
          lessons: [`Unit ${unit} - ${lesson}`]
        },
        results: []
      };

      // Save session
      const sessions = this.loadSessions();
      sessions[sessionId] = session;
      this.saveSessions(sessions);

      // Save individual file
      const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
      fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

      return {
        sessionId,
        vocabCount: quizVocabulary.length
      };
    } catch (error) {
      console.error('Error preparing quiz from lesson:', error);
      throw error;
    }
  }
}

export default new QuizService();