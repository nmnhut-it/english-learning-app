/**
 * Lesson Select Scene - Hierarchical selection: Grade → Unit → Start
 */

class LessonSelectScene extends Phaser.Scene {
  constructor() {
    super('LessonSelectScene');
    this.selectedGrade = null;
    this.selectedUnit = null;
    this.scrollY = 0;
  }

  create() {
    this.scrollY = 0;
    this.selectedGrade = null;
    this.selectedUnit = null;

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK);

    // Show grade selection
    this.showGradeSelection();

    // Keyboard controls
    this.setupKeyboard();
  }

  setupKeyboard() {
    this.input.keyboard.on('keydown-ESC', () => {
      AudioManager.playEffect('click');
      if (this.selectedUnit) {
        this.selectedUnit = null;
        this.showUnitSelection();
      } else if (this.selectedGrade) {
        this.selectedGrade = null;
        this.showGradeSelection();
      } else {
        this.scene.start('MenuScene');
      }
    });
  }

  clearContent() {
    if (this.contentContainer) {
      this.contentContainer.destroy();
    }
    this.contentContainer = this.add.container(0, 0);
  }

  showGradeSelection() {
    this.clearContent();

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 50, LANG.selectGrade, {
      fontSize: '28px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.contentContainer.add(title);

    // Get available grades from vocabulary
    const sets = getAllVocabSets();
    const grades = new Set();
    sets.forEach(set => {
      if (set.grade) grades.add(set.grade);
    });
    const sortedGrades = [...grades].sort((a, b) => a - b);

    // Create grade buttons
    const startY = 120;
    const buttonHeight = 70;
    const buttonWidth = 300;

    sortedGrades.forEach((grade, index) => {
      const y = startY + index * (buttonHeight + 15);
      const unitCount = sets.filter(s => s.grade === grade).length;

      this.createButton(
        GAME_WIDTH / 2,
        y,
        buttonWidth,
        buttonHeight,
        `${LANG.grades[grade] || 'Lớp ' + grade}`,
        `${unitCount} bài học`,
        COLORS.PRIMARY,
        () => {
          this.selectedGrade = grade;
          this.showUnitSelection();
        },
        String(index + 1)
      );
    });

    // Back button
    this.createBackButton(() => this.scene.start('MenuScene'));

    // Keyboard hint
    this.addKeyboardHint();
  }

  showUnitSelection() {
    this.clearContent();

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 50, `${LANG.grades[this.selectedGrade]} - ${LANG.selectUnit}`, {
      fontSize: '24px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.contentContainer.add(title);

    // Get units for this grade
    const sets = getAllVocabSets();
    const gradeUnits = sets.filter(s => s.grade === this.selectedGrade);

    // Group by unit number
    const unitMap = new Map();
    gradeUnits.forEach(set => {
      const unitNum = set.unit || 0;
      if (!unitMap.has(unitNum)) {
        unitMap.set(unitNum, []);
      }
      unitMap.get(unitNum).push(set);
    });

    const sortedUnits = [...unitMap.keys()].sort((a, b) => a - b);

    // Scrollable container for units
    const startY = 100;
    const buttonHeight = 60;
    const buttonWidth = 650;
    const spacing = 10;

    // Create scroll container
    const scrollContainer = this.add.container(0, 0);
    this.contentContainer.add(scrollContainer);

    sortedUnits.forEach((unitNum, index) => {
      const unitSets = unitMap.get(unitNum);
      const totalWords = unitSets.reduce((sum, s) => sum + s.items.length, 0);
      const y = startY + index * (buttonHeight + spacing);

      const btn = this.createButton(
        GAME_WIDTH / 2,
        y,
        buttonWidth,
        buttonHeight,
        `Unit ${unitNum}${unitSets[0].title ? ': ' + unitSets[0].title.split('-').pop().trim() : ''}`,
        `${totalWords} từ vựng`,
        COLORS.SECONDARY,
        () => {
          // Set vocabulary and go to menu
          const selectedSet = unitSets[0];
          setCurrentVocabSet(selectedSet.id);
          this.scene.start('MenuScene');
        },
        index < 9 ? String(index + 1) : null
      );
      scrollContainer.add(btn);
    });

    // Enable scrolling if content overflows
    const totalHeight = sortedUnits.length * (buttonHeight + spacing);
    if (totalHeight > GAME_HEIGHT - 150) {
      this.enableScrolling(scrollContainer, totalHeight, startY);
    }

    // Back button
    this.createBackButton(() => {
      this.selectedGrade = null;
      this.showGradeSelection();
    });

    this.addKeyboardHint();
  }

  createButton(x, y, width, height, title, subtitle, color, onClick, keyHint) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, COLORS.BG_CARD)
      .setStrokeStyle(2, color);

    const titleText = this.add.text(-width / 2 + 20, -8, title, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const subtitleText = this.add.text(-width / 2 + 20, 14, subtitle, {
      fontSize: '13px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0, 0.5);

    container.add([bg, titleText, subtitleText]);

    // Key hint
    if (keyHint) {
      const keyBg = this.add.rectangle(width / 2 - 30, 0, 35, 35, color, 0.3)
        .setStrokeStyle(1, color);
      const keyText = this.add.text(width / 2 - 30, 0, keyHint, {
        fontSize: '16px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.TEXT,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add([keyBg, keyText]);

      // Keyboard listener
      this.input.keyboard.on(`keydown-${keyHint}`, () => {
        AudioManager.playEffect('click');
        onClick();
      });
    }

    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setFillStyle(COLORS.BG_LIGHT);
      bg.setStrokeStyle(3, color);
    });

    container.on('pointerout', () => {
      bg.setFillStyle(COLORS.BG_CARD);
      bg.setStrokeStyle(2, color);
    });

    container.on('pointerdown', () => {
      AudioManager.playEffect('click');
      onClick();
    });

    this.contentContainer.add(container);
    return container;
  }

  createBackButton(onClick) {
    const btn = this.add.text(30, GAME_HEIGHT - 40, LANG.back, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      onClick();
    });

    this.contentContainer.add(btn);
  }

  addKeyboardHint() {
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40,
      '1-9: Chọn nhanh | ESC: Quay lại', {
        fontSize: '12px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.TEXT_MUTED,
      }).setOrigin(0.5);
    this.contentContainer.add(hint);
  }

  enableScrolling(container, totalHeight, startY) {
    const maxScroll = Math.max(0, totalHeight - (GAME_HEIGHT - 150));

    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, maxScroll);
      container.y = -this.scrollY;
    });

    // Touch scrolling
    let startDragY = 0;
    let isDragging = false;

    this.input.on('pointerdown', (pointer) => {
      startDragY = pointer.y;
      isDragging = true;
    });

    this.input.on('pointermove', (pointer) => {
      if (isDragging) {
        const deltaY = startDragY - pointer.y;
        this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, maxScroll);
        container.y = -this.scrollY;
        startDragY = pointer.y;
      }
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });
  }
}
