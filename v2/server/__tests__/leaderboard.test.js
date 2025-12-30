/**
 * Leaderboard API Tests
 */
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { app, LEADERBOARD_DIR } = require('../server');

describe('Leaderboard API', () => {
  const testClassId = 'test-class-' + Date.now();
  const testFilePath = path.join(LEADERBOARD_DIR, `${testClassId}.json`);

  afterAll(() => {
    // Cleanup test data
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  describe('GET /api/leaderboard/:classId', () => {
    it('should return empty leaderboard for new class', async () => {
      const res = await request(app)
        .get(`/api/leaderboard/${testClassId}`)
        .expect(200);

      expect(res.body.classId).toBe(testClassId);
      expect(res.body.students).toEqual({});
      expect(res.body.sessions).toEqual([]);
      expect(res.body.currentSession).toBeNull();
    });

    it('should return existing leaderboard data', async () => {
      // Create some data first
      await request(app)
        .post(`/api/leaderboard/${testClassId}/students`)
        .send({ students: ['Alice', 'Bob'] })
        .expect(200);

      const res = await request(app)
        .get(`/api/leaderboard/${testClassId}`)
        .expect(200);

      expect(res.body.students).toHaveProperty('Alice');
      expect(res.body.students).toHaveProperty('Bob');
    });
  });

  describe('POST /api/leaderboard/:classId/students', () => {
    it('should add students to leaderboard', async () => {
      const res = await request(app)
        .post(`/api/leaderboard/${testClassId}/students`)
        .send({ students: ['Charlie', 'Diana'] })
        .expect(200);

      expect(res.body.added).toBe(2);
      expect(res.body.totalStudents).toBeGreaterThanOrEqual(2);
    });

    it('should not duplicate existing students', async () => {
      // Add Alice again (already exists)
      const res = await request(app)
        .post(`/api/leaderboard/${testClassId}/students`)
        .send({ students: ['Alice'] })
        .expect(200);

      const leaderboard = await request(app)
        .get(`/api/leaderboard/${testClassId}`)
        .expect(200);

      // Should still have Alice with existing data, not duplicated
      expect(leaderboard.body.students.Alice).toBeDefined();
    });

    it('should return error for missing students array', async () => {
      const res = await request(app)
        .post(`/api/leaderboard/${testClassId}/students`)
        .send({})
        .expect(400);

      expect(res.body.error).toBe('Missing students array');
    });
  });

  describe('POST /api/leaderboard/:classId/points', () => {
    it('should add points to a student', async () => {
      const res = await request(app)
        .post(`/api/leaderboard/${testClassId}/points`)
        .send({ studentName: 'Alice', points: 10, reason: 'Good answer' })
        .expect(200);

      expect(res.body.studentName).toBe('Alice');
      expect(res.body.change).toBe(10);
      expect(res.body.newTotal).toBeGreaterThanOrEqual(10);
    });

    it('should subtract points from a student', async () => {
      const beforeRes = await request(app)
        .get(`/api/leaderboard/${testClassId}`)
        .expect(200);
      const beforePoints = beforeRes.body.students.Alice.totalPoints;

      const res = await request(app)
        .post(`/api/leaderboard/${testClassId}/points`)
        .send({ studentName: 'Alice', points: -5, reason: 'Penalty' })
        .expect(200);

      expect(res.body.change).toBe(-5);
      expect(res.body.newTotal).toBe(beforePoints - 5);
    });

    it('should create student if not exists when adding points', async () => {
      const res = await request(app)
        .post(`/api/leaderboard/${testClassId}/points`)
        .send({ studentName: 'NewStudent', points: 15 })
        .expect(200);

      expect(res.body.studentName).toBe('NewStudent');
      expect(res.body.newTotal).toBe(15);
    });

    it('should record point history', async () => {
      await request(app)
        .post(`/api/leaderboard/${testClassId}/points`)
        .send({ studentName: 'Alice', points: 5, reason: 'Bonus' })
        .expect(200);

      const leaderboard = await request(app)
        .get(`/api/leaderboard/${testClassId}`)
        .expect(200);

      const aliceHistory = leaderboard.body.students.Alice.history;
      const lastEntry = aliceHistory[aliceHistory.length - 1];
      expect(lastEntry.points).toBe(5);
      expect(lastEntry.reason).toBe('Bonus');
      expect(lastEntry.timestamp).toBeDefined();
    });

    it('should return error for missing required fields', async () => {
      const res = await request(app)
        .post(`/api/leaderboard/${testClassId}/points`)
        .send({ studentName: 'Alice' }) // missing points
        .expect(400);

      expect(res.body.error).toBe('Missing studentName or points');
    });
  });

  describe('POST /api/leaderboard/:classId/session', () => {
    it('should start a new session', async () => {
      const res = await request(app)
        .post(`/api/leaderboard/${testClassId}/session`)
        .send({ sessionName: 'Week 1' })
        .expect(200);

      expect(res.body.currentSession).toBe('Week 1');
    });

    it('should reset session points but keep total', async () => {
      // Add some points first
      await request(app)
        .post(`/api/leaderboard/${testClassId}/points`)
        .send({ studentName: 'Alice', points: 20 })
        .expect(200);

      const beforeRes = await request(app)
        .get(`/api/leaderboard/${testClassId}`)
        .expect(200);
      const beforeTotal = beforeRes.body.students.Alice.totalPoints;

      // Start new session
      await request(app)
        .post(`/api/leaderboard/${testClassId}/session`)
        .send({ sessionName: 'Week 2', resetPoints: false })
        .expect(200);

      const afterRes = await request(app)
        .get(`/api/leaderboard/${testClassId}`)
        .expect(200);

      expect(afterRes.body.students.Alice.totalPoints).toBe(beforeTotal);
      expect(afterRes.body.students.Alice.sessionPoints).toBe(0);
    });

    it('should reset all points when resetPoints is true', async () => {
      await request(app)
        .post(`/api/leaderboard/${testClassId}/session`)
        .send({ sessionName: 'Fresh Start', resetPoints: true })
        .expect(200);

      const res = await request(app)
        .get(`/api/leaderboard/${testClassId}`)
        .expect(200);

      Object.values(res.body.students).forEach(student => {
        expect(student.totalPoints).toBe(0);
        expect(student.sessionPoints).toBe(0);
      });
    });
  });

  describe('POST /api/leaderboard/:classId/spin', () => {
    beforeAll(async () => {
      // Add student for spin tests
      await request(app)
        .post(`/api/leaderboard/${testClassId}/students`)
        .send({ students: ['SpinTester'] });
    });

    it('should record spin result and add points', async () => {
      const prize = { label: '+10', points: 10 };
      const res = await request(app)
        .post(`/api/leaderboard/${testClassId}/spin`)
        .send({ studentName: 'SpinTester', prize })
        .expect(200);

      expect(res.body.studentName).toBe('SpinTester');
      expect(res.body.prize.points).toBe(10);
      expect(res.body.newTotal).toBeGreaterThanOrEqual(10);
    });

    it('should record spin in history with type', async () => {
      const prize = { label: '+5', points: 5 };
      await request(app)
        .post(`/api/leaderboard/${testClassId}/spin`)
        .send({ studentName: 'SpinTester', prize })
        .expect(200);

      const leaderboard = await request(app)
        .get(`/api/leaderboard/${testClassId}`)
        .expect(200);

      const history = leaderboard.body.students.SpinTester.history;
      const spinEntry = history.find(h => h.type === 'spin');
      expect(spinEntry).toBeDefined();
      expect(spinEntry.reason).toContain('Lucky Wheel');
    });

    it('should return error for missing prize', async () => {
      const res = await request(app)
        .post(`/api/leaderboard/${testClassId}/spin`)
        .send({ studentName: 'SpinTester' })
        .expect(400);

      expect(res.body.error).toBe('Missing studentName or prize');
    });
  });
});

describe('Health Check', () => {
  it('should return ok status', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('vocab-game-server');
  });
});
