const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'vocabulary.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('📁 Connected to SQLite database');
        this.initializeDatabase();
      }
    });
  }

  initializeDatabase() {
    // Create lessons table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        grade INTEGER,
        unit INTEGER,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // Create vocabulary entries table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS vocabulary_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id TEXT,
        word TEXT NOT NULL,
        context_sentence TEXT,
        definition TEXT,
        ipa_pronunciation TEXT,
        part_of_speech TEXT,
        vietnamese_translation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lesson_id) REFERENCES lessons (id)
      )
    `);

    // Create student selections table (tracks which words students selected)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS student_selections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id TEXT,
        word TEXT NOT NULL,
        student_ip TEXT,
        session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lesson_id) REFERENCES lessons (id)
      )
    `);

    // Create vocabulary sessions table (batch processing results)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS vocabulary_sessions (
        id TEXT PRIMARY KEY,
        lesson_id TEXT,
        words_processed TEXT, -- JSON array of words
        gemini_response TEXT, -- Full Gemini response
        processed_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lesson_id) REFERENCES lessons (id)
      )
    `);

    console.log('📊 Database tables initialized');
  }

  // Lesson operations
  createLesson(lesson) {
    return new Promise((resolve, reject) => {
      const { id, title, grade, unit, content } = lesson;
      this.db.run(
        'INSERT INTO lessons (id, title, grade, unit, content) VALUES (?, ?, ?, ?, ?)',
        [id, title, grade, unit, content],
        function(err) {
          if (err) reject(err);
          else resolve({ id, rowId: this.lastID });
        }
      );
    });
  }

  getLesson(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM lessons WHERE id = ? AND is_active = 1', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  getAllLessons() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT id, title, grade, unit, created_at, updated_at FROM lessons WHERE is_active = 1 ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  updateLesson(id, updates) {
    return new Promise((resolve, reject) => {
      const { title, grade, unit, content } = updates;
      this.db.run(
        'UPDATE lessons SET title = ?, grade = ?, unit = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, grade, unit, content, id],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  // Vocabulary operations
  saveVocabularyEntry(entry) {
    return new Promise((resolve, reject) => {
      const { lesson_id, word, context_sentence, definition, ipa_pronunciation, part_of_speech, vietnamese_translation } = entry;
      this.db.run(
        'INSERT INTO vocabulary_entries (lesson_id, word, context_sentence, definition, ipa_pronunciation, part_of_speech, vietnamese_translation) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [lesson_id, word, context_sentence, definition, ipa_pronunciation, part_of_speech, vietnamese_translation],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  getLessonVocabulary(lessonId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM vocabulary_entries WHERE lesson_id = ? ORDER BY created_at',
        [lessonId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Student selection tracking
  recordStudentSelection(lessonId, word, studentIp, sessionId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO student_selections (lesson_id, word, student_ip, session_id) VALUES (?, ?, ?, ?)',
        [lessonId, word, studentIp, sessionId],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  getWordSelectionStats(lessonId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT word, COUNT(*) as selection_count FROM student_selections WHERE lesson_id = ? GROUP BY word ORDER BY selection_count DESC',
        [lessonId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Vocabulary session operations
  saveVocabularySession(session) {
    return new Promise((resolve, reject) => {
      const { id, lesson_id, words_processed, gemini_response, processed_count } = session;
      this.db.run(
        'INSERT INTO vocabulary_sessions (id, lesson_id, words_processed, gemini_response, processed_count) VALUES (?, ?, ?, ?, ?)',
        [id, lesson_id, JSON.stringify(words_processed), gemini_response, processed_count],
        function(err) {
          if (err) reject(err);
          else resolve({ id: session.id });
        }
      );
    });
  }

  getLessonSessions(lessonId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM vocabulary_sessions WHERE lesson_id = ? ORDER BY created_at DESC',
        [lessonId],
        (err, rows) => {
          if (err) reject(err);
          else {
            // Parse JSON strings back to objects
            const sessions = rows.map(row => ({
              ...row,
              words_processed: JSON.parse(row.words_processed)
            }));
            resolve(sessions);
          }
        }
      );
    });
  }

  // Analytics and reporting
  getLessonStats(lessonId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT 
          (SELECT COUNT(*) FROM vocabulary_entries WHERE lesson_id = ?) as vocabulary_count,
          (SELECT COUNT(DISTINCT session_id) FROM student_selections WHERE lesson_id = ?) as unique_students,
          (SELECT COUNT(*) FROM student_selections WHERE lesson_id = ?) as total_selections,
          (SELECT COUNT(*) FROM vocabulary_sessions WHERE lesson_id = ?) as processing_sessions`,
        [lessonId, lessonId, lessonId, lessonId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows[0]);
        }
      );
    });
  }

  // Cleanup and maintenance
  deleteLesson(id) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE lessons SET is_active = 0 WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('📁 Database connection closed');
        }
        resolve();
      });
    });
  }
}

module.exports = Database;