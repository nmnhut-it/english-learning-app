/**
 * Teacher Dashboard Scene - View student progress and vocabulary tracking
 */

const DASHBOARD_SERVER_URL = 'http://localhost:3007';

class TeacherDashboardScene extends Phaser.Scene {
  constructor() {
    super('TeacherDashboardScene');
    this.classes = [];
    this.selectedClass = null;
    this.viewMode = 'classes'; // classes, students, words
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK);

    // Title
    this.add.text(GAME_WIDTH / 2, 30, '📊 Theo Dõi Tiến Độ Học Sinh', {
      fontSize: '24px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(30, 30, LANG.back, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      this.scene.start('MenuScene');
    });

    // Loading indicator
    this.loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '⏳ Đang tải...', {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Load data
    this.loadDashboard();

    // Keyboard
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.viewMode === 'classes') {
        this.scene.start('MenuScene');
      } else {
        this.viewMode = 'classes';
        this.showClassList();
      }
    });
  }

  async loadDashboard() {
    try {
      const response = await fetch(`${DASHBOARD_SERVER_URL}/api/dashboard`);
      if (response.ok) {
        const data = await response.json();
        this.classes = data.classes || [];
        this.loadingText.destroy();
        this.showClassList();
      } else {
        this.showError('Không thể kết nối server');
      }
    } catch (err) {
      this.showError('Server đang offline. Vui lòng chạy server trước.');
    }
  }

  showError(message) {
    this.loadingText.setText(`❌ ${message}`);
    this.loadingText.setColor(COLOR_STRINGS.INCORRECT);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'Chạy lệnh: cd v2/server && npm start', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);
  }

  showClassList() {
    this.viewMode = 'classes';
    this.clearContent();

    if (this.classes.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '📭 Chưa có lớp nào\n\nHãy chơi Thi Đấu Lớp Học và lưu lớp', {
        fontSize: '16px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.TEXT_MUTED,
        align: 'center',
      }).setOrigin(0.5);
      return;
    }

    // Class header
    this.add.text(50, 70, 'Lớp', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      fontStyle: 'bold',
    });
    this.add.text(200, 70, 'Khối', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      fontStyle: 'bold',
    });
    this.add.text(280, 70, 'Số HS', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      fontStyle: 'bold',
    });
    this.add.text(370, 70, 'Theo dõi', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      fontStyle: 'bold',
    });
    this.add.text(470, 70, 'Tuần này', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      fontStyle: 'bold',
    });

    // Class rows
    this.classes.forEach((cls, i) => {
      const y = 100 + i * 40;
      this.createClassRow(cls, y, i);
    });

    // Instructions
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Click vào lớp để xem chi tiết | ESC: Quay lại', {
      fontSize: '12px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);
  }

  createClassRow(cls, y, index) {
    const bg = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 60, 35, COLORS.BG_CARD)
      .setStrokeStyle(1, COLORS.SECONDARY);

    // Class name
    this.add.text(50, y, cls.id, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Grade
    this.add.text(200, y, cls.grade ? `Khối ${cls.grade}` : '-', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0, 0.5);

    // Student count
    this.add.text(280, y, `${cls.studentCount} HS`, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
    }).setOrigin(0, 0.5);

    // Tracked students
    this.add.text(370, y, `${cls.trackedStudents} HS`, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: cls.trackedStudents > 0 ? COLOR_STRINGS.CORRECT : COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0, 0.5);

    // Recent battles
    this.add.text(470, y, `${cls.recentBattles} trận`, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: cls.recentBattles > 0 ? COLOR_STRINGS.SECONDARY : COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0, 0.5);

    // View buttons
    const statsBtn = this.add.text(580, y, '📊', {
      fontSize: '18px',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    statsBtn.on('pointerdown', () => this.showClassStats(cls.id));

    const reviewBtn = this.add.text(620, y, '🔄', {
      fontSize: '18px',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    reviewBtn.on('pointerdown', () => this.startReviewQuiz(cls.id));

    // Make row clickable
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(COLORS.BG_LIGHT));
    bg.on('pointerout', () => bg.setFillStyle(COLORS.BG_CARD));
    bg.on('pointerdown', () => this.showClassStats(cls.id));
  }

  async showClassStats(classId) {
    this.viewMode = 'students';
    this.selectedClass = classId;
    this.clearContent();

    // Loading
    const loading = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '⏳ Đang tải...', {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    try {
      const response = await fetch(`${DASHBOARD_SERVER_URL}/api/stats/${classId}`);
      if (!response.ok) throw new Error();

      const data = await response.json();
      loading.destroy();

      // Title
      this.add.text(GAME_WIDTH / 2, 70, `📊 Thống kê lớp ${classId}`, {
        fontSize: '20px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.SECONDARY,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Back to classes
      const backBtn = this.add.text(50, 70, '← Danh sách lớp', {
        fontSize: '14px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.TEXT_MUTED,
      }).setInteractive({ useHandCursor: true });
      backBtn.on('pointerdown', () => this.showClassList());

      // Show student stats
      this.showStudentStats(data.studentStats);

      // Show difficult words
      this.showDifficultWords(data.difficultWords);

      // Review quiz button
      if (data.difficultWords && data.difficultWords.length > 0) {
        this.createButton(
          GAME_WIDTH / 2, GAME_HEIGHT - 60,
          280, 45,
          '🔄 Ôn Tập Từ Khó',
          COLORS.WARNING,
          () => this.startReviewQuiz(classId)
        );
      }

    } catch (err) {
      loading.setText('❌ Không thể tải dữ liệu');
      loading.setColor(COLOR_STRINGS.INCORRECT);
    }
  }

  showStudentStats(students) {
    if (!students || students.length === 0) {
      this.add.text(100, 110, 'Chưa có dữ liệu học sinh', {
        fontSize: '14px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.TEXT_MUTED,
      });
      return;
    }

    this.add.text(50, 110, '👥 Học sinh', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
      fontStyle: 'bold',
    });

    // Header
    this.add.text(50, 135, 'Tên', { fontSize: '12px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.SECONDARY });
    this.add.text(180, 135, 'Từ vựng', { fontSize: '12px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.SECONDARY });
    this.add.text(250, 135, 'Đúng', { fontSize: '12px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.SECONDARY });
    this.add.text(310, 135, 'Sai', { fontSize: '12px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.SECONDARY });
    this.add.text(360, 135, 'Độ chính xác', { fontSize: '12px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.SECONDARY });

    const maxShow = Math.min(students.length, 8);
    students.slice(0, maxShow).forEach((s, i) => {
      const y = 160 + i * 28;
      const accuracyColor = s.accuracy >= 80 ? COLOR_STRINGS.CORRECT :
                            s.accuracy >= 50 ? COLOR_STRINGS.WARNING :
                            COLOR_STRINGS.INCORRECT;

      this.add.text(50, y, s.name, { fontSize: '13px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.TEXT });
      this.add.text(180, y, `${s.totalWords}`, { fontSize: '13px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.TEXT_MUTED });
      this.add.text(250, y, `${s.totalCorrect}`, { fontSize: '13px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.CORRECT });
      this.add.text(310, y, `${s.totalWrong}`, { fontSize: '13px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.INCORRECT });
      this.add.text(360, y, `${s.accuracy}%`, { fontSize: '13px', fontFamily: 'Segoe UI, system-ui', color: accuracyColor, fontStyle: 'bold' });
    });
  }

  showDifficultWords(words) {
    const startX = 480;

    this.add.text(startX, 110, '📕 Từ khó (hay sai)', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.INCORRECT,
      fontStyle: 'bold',
    });

    if (!words || words.length === 0) {
      this.add.text(startX, 140, 'Chưa có từ khó', {
        fontSize: '13px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.TEXT_MUTED,
      });
      return;
    }

    // Header
    this.add.text(startX, 135, 'Từ', { fontSize: '12px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.SECONDARY });
    this.add.text(startX + 100, 135, 'Tỷ lệ sai', { fontSize: '12px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.SECONDARY });

    const maxShow = Math.min(words.length, 10);
    words.slice(0, maxShow).forEach((w, i) => {
      const y = 160 + i * 25;
      this.add.text(startX, y, w.word, {
        fontSize: '13px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.TEXT,
      });
      this.add.text(startX + 100, y, `${w.errorRate}%`, {
        fontSize: '13px',
        fontFamily: 'Segoe UI, system-ui',
        color: w.errorRate >= 50 ? COLOR_STRINGS.INCORRECT : COLOR_STRINGS.WARNING,
        fontStyle: 'bold',
      });
    });
  }

  async startReviewQuiz(classId) {
    // Fetch review words and start a special review mode
    try {
      const response = await fetch(`${DASHBOARD_SERVER_URL}/api/review-quiz/${classId}?limit=10`);
      if (response.ok) {
        const data = await response.json();
        if (data.reviewWords && data.reviewWords.length > 0) {
          // Store review words and switch to review scene
          window.reviewData = {
            classId,
            words: data.reviewWords
          };
          this.scene.start('VocabReviewScene');
        } else {
          this.showToast('Không có từ cần ôn tập!');
        }
      }
    } catch (err) {
      this.showToast('Lỗi kết nối server');
    }
  }

  showToast(message) {
    const toast = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, message, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      backgroundColor: '#374151',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: GAME_HEIGHT - 120,
      duration: 2000,
      delay: 1000,
      onComplete: () => toast.destroy()
    });
  }

  clearContent() {
    // Remove all except title and back button
    this.children.list
      .filter(child => child.y > 50)
      .forEach(child => child.destroy());
  }

  createButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, color, 0.2)
      .setStrokeStyle(2, color);

    const label = this.add.text(0, 0, text, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => bg.setFillStyle(color, 0.4));
    container.on('pointerout', () => bg.setFillStyle(color, 0.2));
    container.on('pointerdown', () => {
      AudioManager.playEffect('click');
      onClick();
    });

    return container;
  }
}
