/**
 * Leaderboard Scene - Class rankings with points and lucky wheel
 */

class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('LeaderboardScene');
    this.currentClass = null;
    this.leaderboardData = null;
    this.selectedStudent = null;
    this.wheelSpinning = false;
    this.serverAvailable = false;

    // Lucky wheel configuration
    this.wheelPrizes = [
      { label: '+5', points: 5, color: 0x10b981 },
      { label: '+10', points: 10, color: 0x3b82f6 },
      { label: '+15', points: 15, color: 0x8b5cf6 },
      { label: '+20', points: 20, color: 0xf59e0b },
      { label: '+25', points: 25, color: 0xef4444 },
      { label: '+30', points: 30, color: 0xec4899 },
      { label: 'x2', points: 0, color: 0x6366f1, multiplier: 2 },
      { label: '🎁', points: 50, color: 0xfbbf24, special: true },
    ];
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK);

    // Check server
    this.checkServer();

    // Title
    this.add.text(GAME_WIDTH / 2, 30, '🏆 Bảng Xếp Hạng Lớp', {
      fontSize: '26px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
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

    // Show class selector or load from URL params
    if (window.gameUrlParams?.classId) {
      this.currentClass = window.gameUrlParams.classId;
      this.loadLeaderboard();
    } else {
      this.showClassSelector();
    }

    // Keyboard
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  async checkServer() {
    try {
      const response = await fetch('http://localhost:3007/health');
      this.serverAvailable = response.ok;
    } catch {
      this.serverAvailable = false;
    }
  }

  showClassSelector() {
    // Get classes from localStorage
    const classes = this.getSavedClasses();
    const classNames = Object.keys(classes);

    if (classNames.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Chưa có lớp nào!\n\nHãy tạo lớp trong Thi Đấu Lớp Học trước', {
        fontSize: '18px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.TEXT_MUTED,
        align: 'center',
      }).setOrigin(0.5);
      return;
    }

    this.add.text(GAME_WIDTH / 2, 80, 'Chọn lớp:', {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
    }).setOrigin(0.5);

    classNames.forEach((name, i) => {
      const y = 120 + i * 50;
      const btn = this.createButton(GAME_WIDTH / 2, y, 250, 40, name, COLORS.PRIMARY, () => {
        this.currentClass = name;
        this.loadLeaderboard();
      });
    });
  }

  getSavedClasses() {
    try {
      return JSON.parse(localStorage.getItem('classroom_rosters') || '{}');
    } catch {
      return {};
    }
  }

  async loadLeaderboard() {
    this.children.removeAll();
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK);

    // Loading
    const loading = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '⏳ Đang tải...', {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    try {
      // Try to load from server first
      if (this.serverAvailable) {
        const response = await fetch(`http://localhost:3007/api/leaderboard/${encodeURIComponent(this.currentClass)}`);
        if (response.ok) {
          this.leaderboardData = await response.json();
        }
      }

      // Fallback to localStorage or create new
      if (!this.leaderboardData || Object.keys(this.leaderboardData.students).length === 0) {
        const classes = this.getSavedClasses();
        const classData = classes[this.currentClass];
        if (classData?.students) {
          this.leaderboardData = {
            classId: this.currentClass,
            students: {},
            sessions: [],
            currentSession: 'Session 1'
          };
          classData.students.forEach(name => {
            this.leaderboardData.students[name] = {
              totalPoints: 0,
              sessionPoints: 0,
              history: []
            };
          });

          // Save to server
          if (this.serverAvailable) {
            await fetch(`http://localhost:3007/api/leaderboard/${encodeURIComponent(this.currentClass)}/students`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ students: classData.students })
            });
          }
        }
      }

      loading.destroy();
      this.showLeaderboard();
    } catch (err) {
      loading.setText('❌ Lỗi tải dữ liệu');
    }
  }

  showLeaderboard() {
    // Title with class name
    this.add.text(GAME_WIDTH / 2, 30, `🏆 ${this.currentClass}`, {
      fontSize: '24px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Session info
    this.add.text(GAME_WIDTH / 2, 55, this.leaderboardData?.currentSession || 'No Session', {
      fontSize: '12px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(30, 30, '← Đổi lớp', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      this.currentClass = null;
      this.leaderboardData = null;
      this.scene.restart();
    });

    // Left side: Leaderboard list
    this.showRankings();

    // Right side: Lucky wheel
    this.showLuckyWheel();

    // Bottom: Controls
    this.showControls();
  }

  showRankings() {
    const startX = 180;
    const startY = 90;

    this.add.text(startX, startY, '📊 Bảng Điểm', {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Headers
    this.add.text(50, startY + 30, '#', { fontSize: '12px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.SECONDARY });
    this.add.text(80, startY + 30, 'Học sinh', { fontSize: '12px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.SECONDARY });
    this.add.text(220, startY + 30, 'Điểm', { fontSize: '12px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.SECONDARY });
    this.add.text(280, startY + 30, 'Thao tác', { fontSize: '12px', fontFamily: 'Segoe UI, system-ui', color: COLOR_STRINGS.SECONDARY });

    // Sort students by points
    const students = this.leaderboardData?.students || {};
    const sorted = Object.entries(students)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    const medals = ['🥇', '🥈', '🥉'];
    this.studentRows = [];

    sorted.forEach((student, i) => {
      const y = startY + 55 + i * 35;
      const row = this.createStudentRow(student, i, y);
      this.studentRows.push(row);
    });
  }

  createStudentRow(student, index, y) {
    const rank = index < 3 ? medals[index] : `${index + 1}`;
    const isTop3 = index < 3;

    // Background (clickable)
    const bg = this.add.rectangle(180, y, 320, 32, COLORS.BG_CARD)
      .setStrokeStyle(1, this.selectedStudent === student.name ? COLORS.GOLD : COLORS.SECONDARY);

    // Rank
    this.add.text(50, y, rank, {
      fontSize: isTop3 ? '18px' : '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: isTop3 ? COLOR_STRINGS.GOLD : COLOR_STRINGS.TEXT,
    }).setOrigin(0.5);

    // Name
    this.add.text(80, y, student.name, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: isTop3 ? 'bold' : 'normal',
    }).setOrigin(0, 0.5);

    // Points
    const pointsText = this.add.text(220, y, `${student.totalPoints}`, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Quick +/- buttons
    const minusBtn = this.add.text(275, y, '−', {
      fontSize: '20px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.INCORRECT,
      backgroundColor: '#1e293b',
      padding: { x: 8, y: 2 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const plusBtn = this.add.text(315, y, '+', {
      fontSize: '20px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.CORRECT,
      backgroundColor: '#1e293b',
      padding: { x: 8, y: 2 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    minusBtn.on('pointerdown', () => this.adjustPoints(student.name, -5, pointsText));
    plusBtn.on('pointerdown', () => this.adjustPoints(student.name, 5, pointsText));

    // Click to select for wheel
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      this.selectedStudent = student.name;
      AudioManager.playEffect('click');
      this.refreshRankings();
    });

    return { bg, pointsText, student };
  }

  async adjustPoints(studentName, points, textObj) {
    // Update locally
    if (this.leaderboardData.students[studentName]) {
      this.leaderboardData.students[studentName].totalPoints += points;
      this.leaderboardData.students[studentName].sessionPoints += points;
      textObj.setText(`${this.leaderboardData.students[studentName].totalPoints}`);
    }

    AudioManager.playEffect(points > 0 ? 'correct' : 'incorrect');

    // Sync to server
    if (this.serverAvailable) {
      fetch(`http://localhost:3007/api/leaderboard/${encodeURIComponent(this.currentClass)}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, points, reason: 'Quick adjust' })
      });
    }
  }

  refreshRankings() {
    // Re-render rankings
    this.studentRows.forEach(row => {
      row.bg.setStrokeStyle(1, this.selectedStudent === row.student.name ? COLORS.GOLD : COLORS.SECONDARY);
    });
  }

  showLuckyWheel() {
    const centerX = 520;
    const centerY = 280;
    const radius = 130;

    this.add.text(centerX, 90, '🎡 Vòng Quay May Mắn', {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Wheel container
    this.wheelContainer = this.add.container(centerX, centerY);

    // Draw wheel segments
    const segmentAngle = (Math.PI * 2) / this.wheelPrizes.length;

    this.wheelPrizes.forEach((prize, i) => {
      const startAngle = i * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;

      // Draw segment
      const graphics = this.add.graphics();
      graphics.fillStyle(prize.color, 1);
      graphics.beginPath();
      graphics.moveTo(0, 0);
      graphics.arc(0, 0, radius, startAngle, endAngle, false);
      graphics.closePath();
      graphics.fill();

      // Border
      graphics.lineStyle(2, 0xffffff, 0.3);
      graphics.stroke();

      this.wheelContainer.add(graphics);

      // Label
      const midAngle = startAngle + segmentAngle / 2;
      const labelX = Math.cos(midAngle) * (radius * 0.65);
      const labelY = Math.sin(midAngle) * (radius * 0.65);

      const label = this.add.text(labelX, labelY, prize.label, {
        fontSize: '16px',
        fontFamily: 'Segoe UI, system-ui',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setRotation(midAngle + Math.PI / 2);

      this.wheelContainer.add(label);
    });

    // Center circle
    const centerCircle = this.add.circle(0, 0, 25, COLORS.BG_DARK);
    centerCircle.setStrokeStyle(3, COLORS.GOLD);
    this.wheelContainer.add(centerCircle);

    // Pointer (top)
    const pointer = this.add.triangle(centerX, centerY - radius - 15, 0, 0, -15, -25, 15, -25, COLORS.GOLD);

    // Selected student display
    this.selectedDisplay = this.add.text(centerX, centerY + radius + 30, 'Chọn học sinh để quay', {
      fontSize: '13px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Spin button
    this.spinBtn = this.createButton(centerX, centerY + radius + 70, 150, 45, '🎯 QUAY!', COLORS.WARNING, () => {
      this.spinWheel();
    });
  }

  spinWheel() {
    if (this.wheelSpinning) return;
    if (!this.selectedStudent) {
      this.selectedDisplay.setText('⚠️ Chọn học sinh trước!');
      this.selectedDisplay.setColor(COLOR_STRINGS.INCORRECT);
      return;
    }

    this.wheelSpinning = true;
    AudioManager.playEffect('drumroll');

    // Random prize (weighted toward lower values)
    const weights = [25, 20, 18, 15, 10, 7, 3, 2]; // Higher chance for lower prizes
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let prizeIndex = 0;

    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        prizeIndex = i;
        break;
      }
    }

    const prize = this.wheelPrizes[prizeIndex];
    const segmentAngle = (Math.PI * 2) / this.wheelPrizes.length;

    // Calculate final rotation
    // Need to land on the prize at top (pointer position)
    const targetAngle = -prizeIndex * segmentAngle - segmentAngle / 2;
    const spins = 5 + Math.random() * 3; // 5-8 full rotations
    const finalRotation = spins * Math.PI * 2 + targetAngle;

    // Animate wheel
    this.tweens.add({
      targets: this.wheelContainer,
      rotation: finalRotation,
      duration: 4000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.wheelSpinning = false;
        this.awardPrize(prize);
      }
    });

    this.selectedDisplay.setText(`🎰 ${this.selectedStudent} đang quay...`);
    this.selectedDisplay.setColor(COLOR_STRINGS.GOLD);
  }

  async awardPrize(prize) {
    let points = prize.points;
    let message = '';

    if (prize.multiplier) {
      // Double current session points
      const student = this.leaderboardData.students[this.selectedStudent];
      points = student.sessionPoints;
      message = `x2! Nhân đôi ${points} điểm!`;
    } else if (prize.special) {
      message = `🎁 JACKPOT! +${points} điểm!`;
      AudioManager.playEffect('fanfare');
    } else {
      message = `${prize.label} điểm!`;
      AudioManager.playEffect('applause');
    }

    // Update locally
    if (this.leaderboardData.students[this.selectedStudent]) {
      this.leaderboardData.students[this.selectedStudent].totalPoints += points;
      this.leaderboardData.students[this.selectedStudent].sessionPoints += points;
    }

    // Show result
    this.selectedDisplay.setText(`🎉 ${this.selectedStudent}: ${message}`);
    this.selectedDisplay.setColor(COLOR_STRINGS.CORRECT);

    // Big animated text
    const bigText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `+${points}`, {
      fontSize: '80px',
      fontFamily: 'Segoe UI, system-ui',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: bigText,
      alpha: 1,
      scale: 1.5,
      duration: 500,
      yoyo: true,
      onComplete: () => {
        bigText.destroy();
        this.refreshLeaderboard();
      }
    });

    // Sync to server
    if (this.serverAvailable) {
      fetch(`http://localhost:3007/api/leaderboard/${encodeURIComponent(this.currentClass)}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: this.selectedStudent, prize: { ...prize, points } })
      });
    }
  }

  refreshLeaderboard() {
    // Reload the whole view with updated scores
    this.scene.restart();
  }

  showControls() {
    const y = GAME_HEIGHT - 40;

    // New session button
    this.createSmallButton(100, y, '🔄 Session mới', async () => {
      if (this.serverAvailable) {
        await fetch(`http://localhost:3007/api/leaderboard/${encodeURIComponent(this.currentClass)}/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resetPoints: false })
        });
      }
      this.scene.restart();
    });

    // Reset all button
    this.createSmallButton(250, y, '🗑️ Reset điểm', async () => {
      if (confirm('Reset tất cả điểm về 0?')) {
        Object.values(this.leaderboardData.students).forEach(s => {
          s.totalPoints = 0;
          s.sessionPoints = 0;
        });
        if (this.serverAvailable) {
          await fetch(`http://localhost:3007/api/leaderboard/${encodeURIComponent(this.currentClass)}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resetPoints: true })
          });
        }
        this.scene.restart();
      }
    });

    // Quick add points
    this.add.text(450, y, 'Thêm nhanh:', {
      fontSize: '12px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0, 0.5);

    [5, 10, 20].forEach((pts, i) => {
      this.createSmallButton(530 + i * 55, y, `+${pts}`, () => {
        if (this.selectedStudent) {
          this.adjustPoints(this.selectedStudent, pts, null);
          this.scene.restart();
        }
      });
    });
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

  createSmallButton(x, y, text, onClick) {
    const btn = this.add.text(x, y, text, {
      fontSize: '12px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      backgroundColor: '#1e293b',
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor(COLOR_STRINGS.TEXT));
    btn.on('pointerout', () => btn.setColor(COLOR_STRINGS.SECONDARY));
    btn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      onClick();
    });

    return btn;
  }
}
