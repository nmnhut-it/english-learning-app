/**
 * Class Management API Tests
 */
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { app, CLASSES_DIR } = require('../server');

describe('Class Management API', () => {
  const testClassId = 'test-class-api-' + Date.now();
  const testFilePath = path.join(CLASSES_DIR, `${testClassId}.json`);

  afterAll(() => {
    // Cleanup test data
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  describe('POST /api/classes/:classId', () => {
    it('should create a new class', async () => {
      const res = await request(app)
        .post(`/api/classes/${testClassId}`)
        .send({
          students: ['Student1', 'Student2', 'Student3'],
          grade: 10
        })
        .expect(200);

      expect(res.body.id).toBe(testClassId);
      expect(res.body.students).toHaveLength(3);
      expect(res.body.grade).toBe(10);
      expect(res.body.createdAt).toBeDefined();
    });

    it('should update existing class', async () => {
      const res = await request(app)
        .post(`/api/classes/${testClassId}`)
        .send({
          students: ['Student1', 'Student2', 'Student3', 'Student4']
        })
        .expect(200);

      expect(res.body.students).toHaveLength(4);
      expect(res.body.updatedAt).toBeDefined();
    });
  });

  describe('GET /api/classes/:classId', () => {
    it('should return class data', async () => {
      const res = await request(app)
        .get(`/api/classes/${testClassId}`)
        .expect(200);

      expect(res.body.id).toBe(testClassId);
      expect(res.body.students).toBeDefined();
    });

    it('should return 404 for non-existent class', async () => {
      const res = await request(app)
        .get('/api/classes/non-existent-class-xyz')
        .expect(404);

      expect(res.body.error).toBe('Class not found');
    });
  });

  describe('GET /api/classes', () => {
    it('should return list of all classes', async () => {
      const res = await request(app)
        .get('/api/classes')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const testClass = res.body.find(c => c.id === testClassId);
      expect(testClass).toBeDefined();
    });
  });

  describe('DELETE /api/classes/:classId', () => {
    it('should delete a class', async () => {
      // Create a class to delete
      const deleteClassId = 'class-to-delete-' + Date.now();
      await request(app)
        .post(`/api/classes/${deleteClassId}`)
        .send({ students: ['Test'] })
        .expect(200);

      // Delete it
      const res = await request(app)
        .delete(`/api/classes/${deleteClassId}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify it's deleted
      await request(app)
        .get(`/api/classes/${deleteClassId}`)
        .expect(404);
    });

    it('should handle deleting non-existent class gracefully', async () => {
      const res = await request(app)
        .delete('/api/classes/non-existent')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});

describe('Battle Results API', () => {
  const testClassId = 'battle-test-' + Date.now();

  describe('POST /api/results', () => {
    it('should save battle result', async () => {
      const res = await request(app)
        .post('/api/results')
        .send({
          classId: testClassId,
          lessonId: 'unit-1',
          mode: 'classroom_battle',
          players: [
            { name: 'Player1', score: 100, wordHistory: [] },
            { name: 'Player2', score: 80, wordHistory: [] }
          ]
        })
        .expect(200);

      expect(res.body.classId).toBe(testClassId);
      expect(res.body.players).toHaveLength(2);
      expect(res.body.id).toBeDefined();
    });

    it('should return error for missing required fields', async () => {
      const res = await request(app)
        .post('/api/results')
        .send({ lessonId: 'unit-1' })
        .expect(400);

      expect(res.body.error).toBe('Missing classId or players');
    });
  });

  describe('GET /api/results/:classId', () => {
    it('should return results for a class', async () => {
      const res = await request(app)
        .get(`/api/results/${testClassId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return empty array for class with no results', async () => {
      const res = await request(app)
        .get('/api/results/no-results-class')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });
  });
});

describe('Vocabulary Tracking API', () => {
  const testClassId = 'tracking-test-' + Date.now();

  beforeAll(async () => {
    // Create a battle result with word history
    await request(app)
      .post('/api/results')
      .send({
        classId: testClassId,
        players: [
          {
            name: 'TrackedStudent',
            score: 50,
            wordHistory: [
              { word: 'hello', correct: true },
              { word: 'world', correct: true },
              { word: 'test', correct: false }
            ]
          }
        ]
      });
  });

  describe('GET /api/tracking/:classId', () => {
    it('should return vocabulary tracking data', async () => {
      const res = await request(app)
        .get(`/api/tracking/${testClassId}`)
        .expect(200);

      expect(res.body.students).toBeDefined();
      expect(res.body.students.TrackedStudent).toBeDefined();
    });
  });

  describe('GET /api/review/:classId/:studentName', () => {
    it('should return words due for review', async () => {
      const res = await request(app)
        .get(`/api/review/${testClassId}/TrackedStudent`)
        .expect(200);

      expect(res.body.dueWords).toBeDefined();
      expect(res.body.stats).toBeDefined();
    });

    it('should return empty for non-existent student', async () => {
      const res = await request(app)
        .get(`/api/review/${testClassId}/NonExistent`)
        .expect(200);

      expect(res.body.dueWords).toEqual([]);
      expect(res.body.stats).toBeNull();
    });
  });

  describe('GET /api/stats/:classId', () => {
    it('should return class statistics', async () => {
      const res = await request(app)
        .get(`/api/stats/${testClassId}`)
        .expect(200);

      expect(res.body.classId).toBe(testClassId);
      expect(res.body.totalStudents).toBeGreaterThan(0);
      expect(res.body.studentStats).toBeDefined();
      expect(res.body.difficultWords).toBeDefined();
    });
  });

  describe('GET /api/review-quiz/:classId', () => {
    it('should return words for review quiz', async () => {
      const res = await request(app)
        .get(`/api/review-quiz/${testClassId}`)
        .expect(200);

      expect(res.body.classId).toBe(testClassId);
      expect(res.body.reviewWords).toBeDefined();
      expect(Array.isArray(res.body.reviewWords)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get(`/api/review-quiz/${testClassId}?limit=5`)
        .expect(200);

      expect(res.body.reviewWords.length).toBeLessThanOrEqual(5);
    });
  });
});

describe('Teacher Dashboard API', () => {
  describe('GET /api/dashboard', () => {
    it('should return dashboard summary', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .expect(200);

      expect(res.body.classes).toBeDefined();
      expect(Array.isArray(res.body.classes)).toBe(true);
      expect(res.body.totalClasses).toBeDefined();
      expect(res.body.totalStudents).toBeDefined();
    });
  });
});
