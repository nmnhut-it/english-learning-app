/**
 * Boot Scene - Loading screen
 * Handles URL parameters for lesson selection and mode
 */

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Parse URL parameters
    const urlParams = this.parseUrlParams();
    this.applyUrlParams(urlParams);

    // Loading text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '📖 Vocabulary Games', {
      fontSize: '36px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
    }).setOrigin(0.5);

    const loadingText = urlParams.grade && urlParams.unit
      ? `Loading Lớp ${urlParams.grade} - Unit ${urlParams.unit}...`
      : 'Loading...';

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, loadingText, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Progress bar
    const barWidth = 300;
    const barHeight = 20;
    const x = (GAME_WIDTH - barWidth) / 2;
    const y = GAME_HEIGHT / 2 + 60;

    this.add.rectangle(GAME_WIDTH / 2, y, barWidth, barHeight, COLORS.BG_CARD)
      .setStrokeStyle(2, COLORS.PRIMARY);

    const progressBar = this.add.rectangle(x + 2, y, 0, barHeight - 4, COLORS.PRIMARY)
      .setOrigin(0, 0.5);

    // Determine target scene based on mode parameter
    const targetScene = this.getTargetScene(urlParams.mode);

    // Animate loading
    this.tweens.add({
      targets: progressBar,
      width: barWidth - 4,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(200, () => {
          this.scene.start(targetScene);
        });
      },
    });
  }

  /**
   * Parse URL parameters
   */
  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      grade: params.get('grade') ? parseInt(params.get('grade')) : null,
      unit: params.get('unit') ? parseInt(params.get('unit')) : null,
      lesson: params.get('lesson'),
      vocabSet: params.get('vocabSet'),
      mode: params.get('mode'),
    };
  }

  /**
   * Apply URL parameters to select vocabulary set
   */
  applyUrlParams(params) {
    // Store params globally for other scenes
    window.gameUrlParams = params;

    // Try to find and set the vocabulary set
    if (params.vocabSet) {
      // Try exact match first
      if (setCurrentVocabSet(params.vocabSet)) {
        console.log(`📚 Loaded vocab set: ${params.vocabSet}`);
        return;
      }
    }

    // Try to find by grade and unit
    if (params.grade && params.unit) {
      const allSets = getAllVocabSets();

      // Try to find matching set
      const matchingSets = allSets.filter(set =>
        set.grade === params.grade && set.unit === params.unit
      );

      if (matchingSets.length > 0) {
        // If lesson type specified, try to find exact match
        if (params.lesson) {
          const exactMatch = matchingSets.find(set =>
            set.id?.toLowerCase().includes(params.lesson.toLowerCase()) ||
            set.title?.toLowerCase().includes(params.lesson.toLowerCase())
          );
          if (exactMatch) {
            setCurrentVocabSet(exactMatch.id);
            console.log(`📚 Loaded vocab set: ${exactMatch.title}`);
            return;
          }
        }

        // Use first matching set
        setCurrentVocabSet(matchingSets[0].id);
        console.log(`📚 Loaded vocab set: ${matchingSets[0].title}`);
      } else {
        console.log(`⚠️ No vocab set found for Grade ${params.grade} Unit ${params.unit}`);
      }
    }
  }

  /**
   * Get target scene based on mode parameter
   */
  getTargetScene(mode) {
    const modeMap = {
      'classroom': 'ClassroomBattleScene',
      'battle': 'ClassroomBattleScene',
      'review': 'TeacherDashboardScene',
      'dashboard': 'TeacherDashboardScene',
      'flashcard': 'FlashcardScene',
      'match': 'MeaningMatchScene',
      'pronunciation': 'PronunciationScene',
      'blitz': 'WordBlitzScene',
      'daily': 'DailyChallengeScene',
    };

    return modeMap[mode] || 'MenuScene';
  }
}
