import Phaser from "phaser";
import MapLoader from "../MapLoader";
import { MAPS, buildMapManifest } from "../config/mapConfig";
import QuestManager from "../systems/questManager";
import DialogueManager from "../systems/dialogueManager";
import CutsceneManager from "../systems/cutSceneManager";
import { CUTSCENES } from "../config/cutSceneConfig";
import { CUTSCENE_OPTIONS } from "../config/cutSceneConfig";
import pythonQuests from "../../data/pythonExercises.json";
import jsQuests from "../../data/javascriptExercises.json";
import cppQuests from "../../data/cppExercises.json";
import QuestHUD from "../systems/questHUD";
import ExitArrowManager from "../systems/exitArrowHUD";
import QuestIconManager from "../systems/questIconManager";
// import { worldState } from "../systems/worldState";
import ChestQuestManager from "../systems/chestQuestManager";
import HelpManager from "../systems/helpManager";
import HelpButton from "../ui/helpButton";
import QuestCompleteToast from "../ui/questCompleteToast";
import BadgeUnlockPopup from "../ui/badgeUnlockPopup";
import LessonExampleSplash from "../ui/lessonExampleSplash";
import CinematicBars from "../systems/cinematicBars";
import OrientationManager from "../systems/orientationManager";
import MobileControls from "../systems/mobileControls";
import QuestValidator from "../systems/questValidator";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.exerciseId = data.exerciseId;
    this.quest = data.quest || null;
    this.completedQuestIds = new Set(data.completedQuests || []);

    this._lessonExampleSplashShownForQuestId = null;
    this.lessonExampleSplash = null;

    const normalizeLanguage = (value) => {
      const normalized = String(value || "").toLowerCase();
      if (normalized === "c++" || normalized === "cpp") return "Cpp";
      if (normalized === "javascript" || normalized === "js") return "JavaScript";
      if (normalized === "python" || normalized === "py") return "Python";
      return null;
    };

    const languageFromQuest =
      normalizeLanguage(this.quest?.programming_languages?.slug) ||
      normalizeLanguage(this.quest?.programming_languages?.name);

    const storedLanguage = normalizeLanguage(localStorage.getItem("lastCourseTitle"));

    this.language = languageFromQuest || storedLanguage || "Python";

    if (!this.quest || !this.quest.map_id) {
      console.error("❌ Quest missing or invalid. Using fallback map1.");
      this.currentMapId = "map9";
    } else {
      this.currentMapId = this.quest.map_id; // ✅ CORRECT FIELD
    }

    this.mapData = MAPS[this.language]?.[this.currentMapId];

    if (!this.mapData) {
      console.error("❌ Map not found:", {
        language: this.language,
        mapId: this.currentMapId
      });
    }

    this.selectedCharacterId = Number(localStorage.getItem("selectedCharacter")) || 0;
    this.assetManifest = buildMapManifest({
      language: this.language,
      mapId: this.currentMapId,
      characterId: this.selectedCharacterId,
    });

    this.playerCanMove = true;
    this.gamePausedByTerminal = false;
    this.worldState = { abilities: new Set() };
    this.openedChests = new Set();
    this.cutsceneSkipButton = null;
    this._typingCheckNextAt = 0;
    this._isTypingInUICached = false;
    this._mobileControlsEnabled = null;
    this._pointerTargetCache = { target: null, nextAt: 0 };
    this._arrowVisible = false;
  }

  getQuestLessonSplashContent(quest) {
    if (!quest) return { title: "", body: "" };
    const title = String(quest.title || "").trim();
    const body = String(quest.lesson_example || "").trim();
    return { title, body };
  }

  maybeShowLessonExampleSplash() {
    const questId = Number(this.quest?.id ?? this.exerciseId);
    if (Number.isFinite(questId) && this._lessonExampleSplashShownForQuestId === questId) return;

    const { title, body } = this.getQuestLessonSplashContent(this.quest);
    if (!title && !body) return;

    if (Number.isFinite(questId)) {
      this._lessonExampleSplashShownForQuestId = questId;
    }
    this.lessonExampleSplash?.show({ title, body });
  }

  loadSpritesheetIfMissing(key, path, options) {
    if (this.textures.exists(key)) return;
    this.load.spritesheet(key, path, options);
  }

  loadAudioIfMissing(key, path) {
    if (this.cache.audio.exists(key)) return;
    this.load.audio(key, path);
  }

  isGameplayLocked() {
    const questActive = Boolean(
      this.questManager?.activeQuest && !this.questManager.activeQuest.completed
    );

    const cutsceneRunning = Boolean(
      this.cutsceneManager?.running && !this.cutsceneManager.stopRequested
    );

    return (
      !this.playerCanMove ||
      questActive ||
      cutsceneRunning ||
      this.dialogueManager?.active ||
      this.questHUD?.visible ||
      this.gamePausedByTerminal ||
      this.isTypingInUI()
    );
  }

  createCutsceneSkipButton(onSkip) {
    this.destroyCutsceneSkipButton();

    const { width } = this.scale;
    this.cutsceneSkipButton = this.add.text(width - 20, 18, "Skip", {
      font: "bold 20px Arial",
      fill: "#ffffff",
      backgroundColor: "#00000088",
      padding: { x: 12, y: 6 },
    })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(30010)
      .setInteractive({ useHandCursor: true });

    this.cutsceneSkipButton.on("pointerdown", () => {
      onSkip?.();

      // Immediately restore gameplay camera view when skipping.
      if (this.player && this.cameras?.main) {
        this.cameras.main.panEffect?.reset?.();
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.centerOn(this.player.x, this.player.y);
      }
      this.cinematicBars?.hide?.(250);
      this.playerCanMove = true;

      this.destroyCutsceneSkipButton();
    });

    this.handleCutsceneSkipResize = () => {
      if (!this.cutsceneSkipButton) return;
      this.cutsceneSkipButton.setPosition(this.scale.width - 20, 18);
    };

    this.scale.on("resize", this.handleCutsceneSkipResize);
  }

  destroyCutsceneSkipButton() {
    if (this.handleCutsceneSkipResize) {
      this.scale.off("resize", this.handleCutsceneSkipResize);
      this.handleCutsceneSkipResize = null;
    }

    if (this.cutsceneSkipButton) {
      this.cutsceneSkipButton.destroy();
      this.cutsceneSkipButton = null;
    }
  }

  setupLayerSwitching() {
    // Get the layer references
    this.groundLayer = this.mapLoader.map.getLayer("ground")?.tilemapLayer;
    this.thingsLayer = this.mapLoader.map.getLayer("things")?.tilemapLayer;
    this.groundInvisibleLayer = this.mapLoader.map.getLayer("ground_invisible")?.tilemapLayer;
    this.thingsInvisibleLayer = this.mapLoader.map.getLayer("things_invisible")?.tilemapLayer;

    // Set initial state
    this.layersSwitched = false;

    // Initially show ground/things, hide invisible layers
    if (this.groundLayer) this.groundLayer.setVisible(true);
    if (this.thingsLayer) this.thingsLayer.setVisible(true);
    if (this.groundInvisibleLayer) this.groundInvisibleLayer.setVisible(false);
    if (this.thingsInvisibleLayer) this.thingsInvisibleLayer.setVisible(false);

  }

  openGates() {
    // Get gate layers
    const gateCloseLayer = this.mapLoader.map.getLayer("gate_close")?.tilemapLayer;
    const gateOpenLayer = this.mapLoader.map.getLayer("gate_open")?.tilemapLayer;

    if (!gateCloseLayer || !gateOpenLayer) {
      console.warn("⚠️ Gate layers not found in map");
      return;
    }

    // Open gates (show open layer, hide closed layer)
    gateCloseLayer.setVisible(false);
    gateCloseLayer.forEachTile(t => t.setCollision(false));
    gateOpenLayer.setVisible(true);

  }

  openDoors() {
    // Get door layers
    const doorCloseLayer = this.mapLoader.map.getLayer("door_close")?.tilemapLayer;
    const doorOpenLayer = this.mapLoader.map.getLayer("door_open")?.tilemapLayer;

    if (!doorCloseLayer || !doorOpenLayer) {
      console.warn("⚠️ Door layers not found in map");
      return;
    }

    // Open doors (show open layer, hide closed layer)
    doorCloseLayer.setVisible(false);
    doorOpenLayer.setVisible(true);

  }

  toggleLayers() {
    if (!this.groundLayer || !this.thingsLayer || !this.groundInvisibleLayer || !this.thingsInvisibleLayer) {
      console.warn("⚠️ Missing required layers for switching");
      return;
    }

    this.layersSwitched = !this.layersSwitched;

    if (this.layersSwitched) {
      // Show invisible layers, hide normal layers
      this.groundLayer.setVisible(false);
      this.thingsLayer.setVisible(false);
      this.groundInvisibleLayer.setVisible(true);
      this.thingsInvisibleLayer.setVisible(true);
    } else {
      // Show normal layers, hide invisible layers
      this.groundLayer.setVisible(true);
      this.thingsLayer.setVisible(true);
      this.groundInvisibleLayer.setVisible(false);
      this.thingsInvisibleLayer.setVisible(false);
    }
  }

  preload() {
    this.mapLoader = new MapLoader(this);
    if (!this.assetManifest?.map) return;

    this.mapLoader.load(
      this.assetManifest.map.mapKey,
      this.assetManifest.map.mapJson,
      this.assetManifest.tilesets
    );

    this.assetManifest.spritesheets.forEach((sheet) => {
      this.loadSpritesheetIfMissing(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    });

    this.assetManifest.audio.forEach((audio) => {
      this.loadAudioIfMissing(audio.key, audio.path);
    });
  }

  onQuestComplete = async (e) => {
    const questId = e.detail?.questId;
    if (!questId) return;

    // Keep completion flow inside engine too (not only React page listeners)
    this.questManager?.completeQuest(Number(questId), { emitEvent: false });

    const quest = this.questManager.getQuestById(Number(questId));
    if (!quest) return;

    const gainedExp = quest.experience || 0;



    // 🎒 Grant ability (if any)
    if (quest.grants) {
      this.worldState.abilities.add(quest.grants);
    }


    // ✅ ALWAYS show quest completed toast
    this.questCompleteToast.show({
      title: quest.title,
      badgeKey: quest.achievements?.badge_key || null, // toast can ignore if null
      exp: gainedExp
    });

    // ✅ SECOND left-side toast for quest completion
    this.questCongratsToast?.show({
      title: quest.title,
      badgeKey: null,
      exp: 0
    });

    // 🏅 ONLY show badge UI if quest has badge
    if (quest.achievements?.badge_key) {
      this.badgeUnlockPopup.show({
        badgeKey: quest.achievements.badge_key,
        label: quest.achievements.title
      });
    }
  };
  
  create() {
    // 🗺 MAP
    this.mapLoader.create(this.mapData.mapKey, this.mapData.tilesets);

    this.textures.each(t =>
      t.setFilter(Phaser.Textures.FilterMode.NEAREST)
    );

    this.cameras.main.roundPixels = true;

    // 🔄 LAYER SWITCHING SYSTEM (for js_map10)
    if (this.currentMapId === 'map10' && this.language === 'JavaScript') {
      this.setupLayerSwitching();
    }

    // 🎵 Background music removed

    // 🎮 PLAYER ANIMATIONS
    const selectedId = this.selectedCharacterId;

    const characterIdleFrames = {
      0: 1,
      1: 1,
      2: 1,
      3: 1
    };

    const idleFrame = characterIdleFrames[selectedId] || 0;

    ["down", "up", "left", "right"].forEach(dir => {
      this.anims.create({
        key: `walk-${dir}`,
        frames: this.anims.generateFrameNumbers(`player-${dir}`, {
          start: 0,
          end: 2
        }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: `idle-${dir}`,
        frames: [{ key: `player-${dir}`, frame: idleFrame }]
      });
    });

    ["up", "down", "left", "right"].forEach((dir) => {
      const textureKey = `arrow_${dir}`;
      const animKey = `arrow-${dir}`;
      if (this.anims.exists(animKey) || !this.textures.exists(textureKey)) return;

      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(textureKey, {
          start: 0,
          end: 2,
        }),
        frameRate: 6,
        repeat: -1,
      });
    });

    if (!this.anims.exists("quest-icon")) {
      this.anims.create({
        key: "quest-icon",
        frames: this.anims.generateFrameNumbers("quest_icon", {
          start: 0,
          end: 2
        }),
        frameRate: 4,
        repeat: -1
      });
    }

    this.anims.create({
      key: "exclamation",
      frames: this.anims.generateFrameNumbers("exclamation", {
        start: 0,
        end: 2
      }),
      frameRate: 4,
      repeat: -1
    });

    // 🧍 PLAYER
    const spawn = this.getPlayerSpawnPoint();
    this.player = this.physics.add.sprite(spawn.x, spawn.y, "player-down");

    // 👣 FEET-BASED SETUP (CRITICAL)
    this.player.setOrigin(0.5, 1);
    this.player.body.setSize(32, 16);
    this.player.body.setOffset(8, 32);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(100);

    this.createPlayerArrow();

    // 🧱 COLLISIONS
    this.mapLoader.collisionLayers.forEach(layer => {
      this.physics.add.collider(this.player, layer);
    });

    // ⌨ INPUT — ONLY ONCE
    this.cursors = this.input.keyboard.createCursorKeys();

    // Allow typing spaces in Monaco/inputs while the game is mounted.
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);


    // ✅ LETTER KEYS — EVENT BASED (DO NOT BLOCK TERMINAL)
    this.input.keyboard.on("keydown-E", () => {
      if (this.isGameplayLocked()) return;
      this.handleInteract();
    });

    // this.input.on("pointerdown", (pointer) => {
    //   // left click or tap
    //   if (pointer.button !== 0) return;

    //   this.handleInteract();
    // });

    this.input.keyboard.on("keydown-Q", () => {
      if (this.isGameplayLocked()) return;
      this.questHUD.toggle(this.questManager.activeQuest);
    });

    // 🎵 Background music per language
    const BGM_BY_LANGUAGE = {
      Python: "bgm-python",
      JavaScript: "bgm-javascript",
      Cpp: "bgm-cpp"
    };

    const bgmKey = BGM_BY_LANGUAGE[this.language];

    if (bgmKey) {
      this.bgm = this.sound.add(bgmKey, {
        loop: true,
        volume: 0.5
      });

      this.bgm.play();
    }

    this.events.once("shutdown", () => {
      if (this.bgm) {
        this.bgm.stop();
      }
    });



    this.handleTerminalActive = () => {
      this.gamePausedByTerminal = true;

      if (this.player?.body) {
        this.player.setVelocity(0);
      }

      this.input.keyboard.enabled = false;
      this.syncMobileControlsVisibility();
    };

    this.handleTerminalInactive = () => {
      this.gamePausedByTerminal = false;
      this.input.keyboard.enabled = true;
      this.syncMobileControlsVisibility();
    };

    window.addEventListener("code-mania:terminal-active", this.handleTerminalActive);
    window.addEventListener("code-mania:terminal-inactive", this.handleTerminalInactive);

    this.events.once("shutdown", () => {
      window.removeEventListener("code-mania:terminal-active", this.handleTerminalActive);
      window.removeEventListener("code-mania:terminal-inactive", this.handleTerminalInactive);
    });


    // 📚 TUTORIAL EVENTS (paused for now)
    window.addEventListener("code-mania:tutorial-open", () => {
      this.isTutorialOpen = true;
    });

    window.addEventListener("code-mania:tutorial-close", () => {
      this.isTutorialOpen = false;
    });

    // 🪨 ROCK LAYERS
    this.interactableRockLayer =
      this.mapLoader.map.getLayer("interactable_rock")?.tilemapLayer;

    this.smallRockLayer =
      this.mapLoader.map.getLayer("small_rock")?.tilemapLayer;

    // BIG ROCKS (BLOCKING)
    if (this.interactableRockLayer) {
      this.interactableRockLayer.setCollisionByProperty({ collides: true });
      this.physics.add.collider(this.player, this.interactableRockLayer);
    }

    // SMALL ROCKS (BROKEN STATE)
    if (this.smallRockLayer) {
      this.smallRockLayer.setVisible(false);
    }
    // 🧰 CHEST LAYERS
    this.chestLayer =
      this.mapLoader.map.getLayer("chest")?.tilemapLayer;

    this.chestOpenLayer =
      this.mapLoader.map.getLayer("chest_open")?.tilemapLayer;

    // 🔒 FORCE INITIAL STATE (DO NOT TRUST TILED VISIBILITY)
    if (this.chestLayer) {
      this.chestLayer.setVisible(true);
      this.chestLayer.setCollisionByProperty({ collision: true });
    }

    if (this.chestOpenLayer) {
      this.chestOpenLayer.setVisible(false);
    }

    this.gateCloseLayer =
      this.mapLoader.map.getLayer("gate_close")?.tilemapLayer;

    this.gateOpenLayer =
      this.mapLoader.map.getLayer("gate_open")?.tilemapLayer;

    if (this.gateCloseLayer) {
      this.gateCloseLayer.setCollisionByProperty({ collides: true });
      this.physics.add.collider(this.player, this.gateCloseLayer);
    }

    if (this.gateOpenLayer) {
      this.gateOpenLayer.setVisible(false);
    }

    this.events.once("shutdown", () => {
      if (this.helpButton) {
        this.helpButton.destroy();
        this.helpButton = null;
      }
    });



    this.createInteractionMarker();

    const w = this.mapLoader.map.widthInPixels;
    const h = this.mapLoader.map.heightInPixels;

    this.physics.world.setBounds(0, 0, w, h);
    this.cameras.main.setBounds(0, 0, w, h);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    const QUESTS_BY_LANGUAGE = {
      Python: pythonQuests,
      JavaScript: jsQuests,
      Cpp: cppQuests
    };

    // 🧠 SYSTEMS
    this.questHUD = new QuestHUD(this);
    this.questManager = new QuestManager(
      this,
      [this.quest],
      this.completedQuestIds
    );

    this.dialogueManager = new DialogueManager(this);
    this.cutsceneManager = new CutsceneManager(this);
    this.exitArrowManager = new ExitArrowManager(this);
    this.questIconManager = new QuestIconManager(this);
    this.chestQuestManager = new ChestQuestManager(this);
    this.helpManager = new HelpManager(this);
    this.questValidator = new QuestValidator(this);
    this.questCompleteToast = new QuestCompleteToast(this);
    this.questCongratsToast = new QuestCompleteToast(this, {
      offsetY: 56,
      titleText: "Quest Complete",
      subtitleText: "Congratulations"
    });
    this.badgeUnlockPopup = new BadgeUnlockPopup(this);
    this.badgeUnlockPopup.container?.setDepth(30000);
    this.cinematicBars = new CinematicBars(this);
    this.lessonExampleSplash = new LessonExampleSplash(this);

    const computeMobileMode = () => {
      const isMobileOs =
        this.sys.game.device.os.android || this.sys.game.device.os.iOS;
      const isTouchCapable = Boolean(this.sys.game.device.input.touch);
      const hasCoarsePointer =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(pointer: coarse)").matches;
      const viewportWidth =
        typeof window !== "undefined" ? window.innerWidth : this.scale.width;
      const smallViewport = viewportWidth <= 820;

      return smallViewport && (isMobileOs || isTouchCapable || hasCoarsePointer);
    };

    this.applyMobileMode = () => {
      const nextIsMobile = computeMobileMode();
      if (nextIsMobile === this.isMobile) return;

      this.isMobile = nextIsMobile;
      this._mobileControlsEnabled = null;

      if (this.isMobile) {
        this.mobileControls = new MobileControls(this, {
          onInteract: () => {
            if (this.isGameplayLocked()) return;
            this.handleInteract();
          }
        });
      } else {
        this.mobileControls?.destroy();
        this.mobileControls = null;
      }

      this.syncMobileControlsVisibility();
    };

    this.isMobile = null;
    this.mobileControls = null;
    this.applyMobileMode();

    this.orientationManager = new OrientationManager(this, {
      requireLandscape: false
    });
    this.syncMobileControlsVisibility();

    this.scale.on("resize", () => {
      this.cinematicBars.resize();
      const { width, height } = this.scale;
      this.applyMobileMode();
      this.mobileControls?.resize(width, height);
      this.syncMobileControlsVisibility();
    });

    this.events.once("shutdown", () => {
      this.mobileControls?.destroy();
      this.mobileControls = null;
      this.destroyCutsceneSkipButton();
    });


    // ✅ QUEST COMPLETE EVENT (AFTER SYSTEMS EXIST)
    window.addEventListener(
      "code-mania:quest-complete",
      this.onQuestComplete
    );

    this.handleQuestStartedForMobile = () => {
      this.syncMobileControlsVisibility();
      this.maybeShowLessonExampleSplash();
    };

    this.handleQuestCompletedForMobile = () => {
      this.syncMobileControlsVisibility();
    };

    this.handleCloseQuestHud = () => {
      this.questHUD?.hide();
      this.syncMobileControlsVisibility();
    };

    window.addEventListener("code-mania:quest-started", this.handleQuestStartedForMobile);
    window.addEventListener("code-mania:quest-complete", this.handleQuestCompletedForMobile);
    window.addEventListener("code-mania:close-quest-hud", this.handleCloseQuestHud);

    this.events.once("shutdown", () => {
      window.removeEventListener(
        "code-mania:quest-complete",
        this.onQuestComplete
      );
      window.removeEventListener("code-mania:quest-started", this.handleQuestStartedForMobile);
      window.removeEventListener("code-mania:quest-complete", this.handleQuestCompletedForMobile);
      window.removeEventListener("code-mania:close-quest-hud", this.handleCloseQuestHud);
    });


    // Help button (always available)
    this.helpButton = new HelpButton(this, () => {
      this.helpManager.openHelp();
    });

    this.createMapExits();
    this.lastDirection = "down";
    // 🧑 NPCs
    this.spawnNPCs();
    this.npcs.forEach(npc => {
      this.physics.add.collider(this.player, npc);
    });

    // 🎬 INTRO
    this.playIntroCutscene();

    const key = `${this.language}_${this.currentMapId}_intro`;
    const hasIntro = Boolean(CUTSCENES[key]);
    if (!hasIntro) {
      this.time.delayedCall(450, () => this.maybeShowLessonExampleSplash());
    }

    this.spawnChestQuestIcons();
    this.scheduleNextMapPrefetch();

    this.events.once("shutdown", () => {
      this.lessonExampleSplash?.destroy();
      this.lessonExampleSplash = null;
    });

  }

  scheduleNextMapPrefetch() {
    const nextMapId = this.mapData?.nextMap;
    if (!nextMapId) return;

    this.time.delayedCall(900, () => {
      this.prefetchMapAssets(nextMapId);
    });
  }

  prefetchMapAssets(mapId) {
    const manifest = buildMapManifest({
      language: this.language,
      mapId,
      characterId: this.selectedCharacterId,
      prefetchOnly: true,
    });

    if (!manifest?.map) return;

    this.mapLoader.load(manifest.map.mapKey, manifest.map.mapJson, manifest.tilesets);

    const hasQueuedFiles = this.load.list?.size > 0;
    if (!this.load.isLoading() && hasQueuedFiles) {
      this.load.start();
    }
  }
  createPlayerArrow() {
    // Use one of your arrow sprites (we'll rotate it dynamically)
    this.playerArrow = this.add.sprite(0, 0, "arrow_up");
    this.playerArrow.setDepth(99);
    if (this.anims.exists("arrow-up")) {
      this.playerArrow.play("arrow-up");
    }

    // Anchor center
    this.playerArrow.setOrigin(0.5);

    this.playerArrow.setVisible(false);
  }


  resizeCamera(gameSize) {
    const cam = this.cameras.main;
    const map = this.mapLoader.map;

    const viewWidth = gameSize.width;
    const viewHeight = gameSize.height;

    const mapWidth = map.widthInPixels;
    const mapHeight = map.heightInPixels;

    // Fit map to screen
    const zoomX = viewWidth / mapWidth;
    const zoomY = viewHeight / mapHeight;
    const zoom = Math.min(zoomX, zoomY);

    cam.setZoom(Math.min(zoom, 3)); // cap zoom
    cam.setViewport(0, 0, viewWidth, viewHeight);
    cam.setBounds(0, 0, mapWidth, mapHeight);

    // Small map → center
    if (
      mapWidth * cam.zoom <= viewWidth &&
      mapHeight * cam.zoom <= viewHeight
    ) {
      cam.stopFollow();
      cam.centerOn(mapWidth / 2, mapHeight / 2);
    } else {
      cam.startFollow(this.player, true, 0.1, 0.1);
    }
  }


  isTypingInUI() {
    const now = this.time?.now ?? Date.now();
    if (now < this._typingCheckNextAt) {
      return this._isTypingInUICached;
    }

    this._typingCheckNextAt = now + 100;
    const active = document.activeElement;
    if (!active) {
      this._isTypingInUICached = false;
      return false;
    }

    const tag = active.tagName;
    const result =
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      active.isContentEditable ||
      Boolean(
      active.closest?.(
        ".monaco-editor, .terminal, .examTerminal, [contenteditable='true'], [role='textbox']"
      )
      );

    this._isTypingInUICached = result;
    return result;
  }

  shouldDisableMobileControls() {
    const dialogueActive = Boolean(this.dialogueManager?.active);
    const questHudVisible = Boolean(this.questHUD?.visible);
    const cutsceneRunning = Boolean(
      this.cutsceneManager?.running && !this.cutsceneManager.stopRequested
    );
    const questActive = Boolean(
      this.questManager?.activeQuest && !this.questManager.activeQuest.completed
    );

    return (
      this.gamePausedByTerminal ||
      this.isTypingInUI() ||
      dialogueActive ||
      questHudVisible ||
      cutsceneRunning ||
      !this.playerCanMove ||
      questActive
    );
  }

  syncMobileControlsVisibility() {
    if (!this.isMobile || !this.mobileControls) return;
    const shouldEnable = !this.shouldDisableMobileControls();
    if (this._mobileControlsEnabled === shouldEnable) return;
    this._mobileControlsEnabled = shouldEnable;
    this.mobileControls.setEnabled(shouldEnable);
  }

  update() {
    this.syncMobileControlsVisibility();

    if (this.isGameplayLocked()) {
      if (this.player?.body) {
        this.player.setVelocity(0);
        this.player.anims.stop();
      }
      return;
    }

    const speed = 180;
    this.player.setVelocity(0);

    let moving = false;

    if (this.isMobile && this.mobileControls) {
      const vx = this.mobileControls.vector.x * speed;
      const vy = this.mobileControls.vector.y * speed;

      this.player.setVelocity(vx, vy);

      moving = Math.abs(vx) > 1 || Math.abs(vy) > 1;

      if (moving) {
        if (Math.abs(vx) > Math.abs(vy)) {
          this.lastDirection = vx > 0 ? "right" : "left";
        } else {
          this.lastDirection = vy > 0 ? "down" : "up";
        }
      }
    } else {
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-speed);
        this.lastDirection = "left";
        moving = true;
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(speed);
        this.lastDirection = "right";
        moving = true;
      }

      if (this.cursors.up.isDown) {
        this.player.setVelocityY(-speed);
        this.lastDirection = "up";
        moving = true;
      } else if (this.cursors.down.isDown) {
        this.player.setVelocityY(speed);
        this.lastDirection = "down";
        moving = true;
      }
    }



    const anim = moving
      ? `walk-${this.lastDirection}`
      : `idle-${this.lastDirection}`;
    this.player.anims.play(anim, true);
    this.updatePlayerArrow();

  }

  updatePlayerArrow() {
    if (!this.playerArrow || !this.player) return;

    const target = this.getCurrentPointerTarget();

    if (!target) {
      this.playerArrow.setVisible(false);
      this._arrowVisible = false;
      return;
    }

    // 📏 Distance from player to target
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      target.x,
      target.y
    );

    const hideDistance = 95;
    const showDistance = 120;

    if (this._arrowVisible) {
      if (distance <= hideDistance) {
        this._arrowVisible = false;
      }
    } else if (distance >= showDistance) {
      this._arrowVisible = true;
    }

    if (!this._arrowVisible) {
      this.playerArrow.setVisible(false);
      return;
    }

    this.playerArrow.setVisible(true);

    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      target.x,
      target.y
    );

    const radius = 40;

    const targetX = this.player.x + Math.cos(angle) * radius;
    const targetY = this.player.y + Math.sin(angle) * radius;

    if (!Number.isFinite(this.playerArrow.x) || !Number.isFinite(this.playerArrow.y)) {
      this.playerArrow.setPosition(targetX, targetY);
    } else {
      this.playerArrow.setPosition(
        Phaser.Math.Linear(this.playerArrow.x, targetX, 0.35),
        Phaser.Math.Linear(this.playerArrow.y, targetY, 0.35)
      );
    }

    this.playerArrow.setRotation(
      Phaser.Math.Angle.RotateTo(this.playerArrow.rotation, angle + Math.PI / 2, 0.18)
    );
  }



  getCurrentPointerTarget() {
    const now = this.time?.now ?? Date.now();
    if (now < this._pointerTargetCache.nextAt) {
      return this._pointerTargetCache.target;
    }

    this._pointerTargetCache.nextAt = now + 120;

    // 1️⃣ Prioritize chest quests on map (current objective in maps like Python map2)
    const activeQuest = this.questManager?.activeQuest;
    const icons = this.chestQuestManager?.icons;

    if (icons && icons.size > 0) {
      if (activeQuest && !activeQuest.completed) {
        const activeIdNum = Number(activeQuest.id);
        const activeIcon =
          icons.get(activeIdNum) ||
          icons.get(String(activeQuest.id));

        if (activeIcon?.active) {
          this._pointerTargetCache.target = activeIcon;
          return activeIcon;
        }
      }

      for (const [questId, icon] of icons.entries()) {
        const quest = this.questManager?.getQuestById(questId);
        if (quest && !quest.completed && icon?.active) {
          this._pointerTargetCache.target = icon;
          return icon;
        }
      }
    }

    // 2️⃣ If any exit requires a completed quest → point to it
    const exitZone = this.mapExits?.getChildren()?.find(zone => {
      const requiredQuest = zone.exitData?.requiredQuest;
      if (!requiredQuest) return false;
      return this.isRequiredQuestSatisfied(requiredQuest);
    });

    if (exitZone) {
      this._pointerTargetCache.target = exitZone;
      return exitZone;
    }

    // 3️⃣ Otherwise point to first incomplete NPC quest
    const npc = this.npcs?.find(n => {
      const quest = this.questManager.getQuestById(n.npcData.questId);
      return quest && !quest.completed;
    });

    if (npc) {
      this._pointerTargetCache.target = npc;
      return npc;
    }

    // 4️⃣ If no NPC quest remains, point to a map exit
    const anyExit = this.mapExits?.getChildren?.()?.[0] || null;
    if (anyExit) {
      this._pointerTargetCache.target = anyExit;
      return anyExit;
    }

    this._pointerTargetCache.target = null;
    return null;
  }

  isRequiredQuestSatisfied(requiredQuest) {
    const required = Number(requiredQuest);
    if (!Number.isFinite(required)) return false;

    const quest = this.questManager?.getQuestById(this.exerciseId) || this.quest;
    if (!quest || !quest.completed) return false;

    return Number(quest.id) === required || Number(quest.order_index) === required;
  }





  spawnChestQuestIcons() {
    const chestLayer = this.mapLoader.map.getLayer("chest")?.tilemapLayer;
    if (!chestLayer) return;

    chestLayer.forEachTile(tile => {
      if (!tile.properties) return;
      if (tile.properties.type !== "chest") return;

      const questId = tile.properties.quest_id;
      if (!questId) return;

      const quest = this.questManager.getQuestById(questId);
      if (!quest || quest.completed) return;

      const worldX = chestLayer.tileToWorldX(tile.x) + tile.width / 2;
      const worldY = chestLayer.tileToWorldY(tile.y);

      this.chestQuestManager.createIcon(worldX, worldY, questId);
    });
  }


  spawnNPCs() {
    const layer = this.mapLoader.map.getObjectLayer("spawn");
    if (!layer) return;

    this.npcs = [];

    layer.objects
      .filter(o =>
        o.properties?.some(p => p.name === "type" && p.value === "npc")
      )
      .forEach(obj => {
        const npc = this.physics.add.sprite(
          obj.x + obj.width / 2,
          obj.y - obj.height / 2,
          "npc-villager"
        );

        npc.setOrigin(0.5, 1);
        npc.body.setSize(48, 48);
        npc.body.setOffset(8, 32);
        npc.body.immovable = true;

        npc.npcData = {
          questId: this.exerciseId
        };


        // ✅ THIS WAS MISSING
        this.npcs.push(npc);
        this.physics.add.collider(this.player, npc);

        // Hide NPC sprite for JavaScript mode
        if (this.language === "JavaScript") {
          npc.setVisible(false);
        }

        const quest = this.questManager.getQuestById(npc.npcData.questId);
        if (quest && !quest.completed) {
          npc.questIcon = this.questIconManager.createIcon(npc, true);
        }
      });
  }


  createInteractionMarker() {
    this.interactionMarker = this.add.container(0, 0).setDepth(999);


    this.tweens.add({
      targets: this.interactionMarker,
      y: "-=10",
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.interactPrompt = this.add.text(0, 0, "Press E", {
      font: "16px Arial",
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3
    })
      .setOrigin(0.5, 1)
      .setDepth(999);

    this.interactPrompt.setVisible(false);
  }

  updateInteractionMarker() {
    if (!this.npcs || this.npcs.length === 0) {
      this.interactionMarker?.setVisible(false);
      this.interactPrompt?.setVisible(false);
      return;
    }

    const nearestNpc = this.npcs.reduce((best, n) => {
      if (!best) return n;
      const dn = Phaser.Math.Distance.Between(this.player.x, this.player.y, n.x, n.y);
      const db = Phaser.Math.Distance.Between(this.player.x, this.player.y, best.x, best.y);
      return dn < db ? n : best;
    }, null);

    if (!nearestNpc) return;

    const d = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      nearestNpc.x,
      nearestNpc.y
    );

    const inRange = d <= 50;

    if (this.interactionMarker) {
      this.interactionMarker.setPosition(nearestNpc.x, nearestNpc.y - 52);
      this.interactionMarker.setVisible(!inRange);
      this.interactionMarker.setAlpha(Phaser.Math.Clamp((d - 50) / 200, 0.25, 1));
    }

    if (this.interactPrompt) {
      this.interactPrompt.setPosition(this.player.x, this.player.y - 40);
      this.interactPrompt.setVisible(inRange);
    }
  }

  getSpawnPoint(name) {
    const layer = this.mapLoader.map.getObjectLayer("spawn");
    const obj = layer?.objects.find(o => o.name === name);

    if (!obj) return { x: 100, y: 100 };

    const width = Number(obj.width) || 0;
    const height = Number(obj.height) || 0;
    const isPoint = Boolean(obj.point) || (width === 0 && height === 0);

    const x = Number(obj.x) + width / 2;
    const y = isPoint ? Number(obj.y) : Number(obj.y) + height;

    return { x, y };
  }

  getPlayerSpawnPoint() {
    // Check for custom spawn point from previous map
    const customSpawn = this.scene.settings.data?.spawnPoint;
    if (customSpawn) {
      const customPoint = this.getSpawnPoint(customSpawn);
      return customPoint;
    }

    // Fall back to default spawn
    return this.getSpawnPoint("player_spawn");
  }

  tryInteractWithNPC() {
    const npc = this.npcs.find(n =>
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        n.x,
        n.y
      ) <= 50
    );

    if (!npc) return false; // 👈 IMPORTANT

    this.interactionMarker?.setVisible(false);
    this.interactPrompt?.setVisible(false);

    const quest = this.questManager.getQuestById(npc.npcData.questId);
    if (!quest) return false;

    this.playerCanMove = false;

    // 1️⃣ QUEST NOT STARTED
    if (
      !quest.completed &&
      this.questManager.activeQuest?.id !== quest.id
    ) {
      // DOOR OPENING FOR JS_MAP7
      if (this.currentMapId === 'map7' && this.language === 'JavaScript') {
        this.openDoors();
      }

      // DOOR OPENING FOR JS_MAP8
      if (this.currentMapId === 'map8' && this.language === 'JavaScript') {
        this.openDoors();
      }

      // GATE OPENING FOR JS_MAP15 (when quest starts)
      if (this.currentMapId === 'map15' && this.language === 'JavaScript') {
        this.openGates();
      }

      // LAYER SWITCHING FOR JS_MAP10 (whenever quest starts)
      if (this.currentMapId === 'map10' && this.language === 'JavaScript') {
        this.toggleLayers();
      }

      this.dialogueManager.startDialogue(
        quest.dialogue || [],
        () => {
          this.questManager.startQuest(quest.id);
          window.dispatchEvent(
            new CustomEvent("code-mania:quest-started", {
              detail: { questId: quest.id }
            })
          );
          this.playerCanMove = true;
        }
      );
      return true; // ✅ INPUT CONSUMED
    }

    // 2️⃣ QUEST ACTIVE BUT NOT DONE
    if (!quest.completed) {
      this.dialogueManager.startDialogue(
        ["Solve the challenge to earn the key."],
        () => (this.playerCanMove = true)
      );
      return true;
    }

    // 3 QUEST COMPLETED → GIVE KEY
    if (quest.completed && quest.grants) {
      if (!this.worldState.abilities.has(quest.grants)) {
        this.worldState.abilities.add(quest.grants);

        // DOOR OPENING FOR JS_MAP7
        if (this.currentMapId === 'map7' && this.language === 'JavaScript') {
          this.openDoors();
        }

        // DOOR OPENING FOR JS_MAP8
        if (this.currentMapId === 'map8' && this.language === 'JavaScript') {
          this.openDoors();
        }

        // GATE OPENING FOR JS_MAP15 (when quest completes)
        if (this.currentMapId === 'map15' && this.language === 'JavaScript') {
          this.openGates();
        }

        // LAYER SWITCHING FOR JS_MAP10
        if (this.currentMapId === 'map10' && this.language === 'JavaScript') {
          this.toggleLayers();
        }

        this.dialogueManager.startDialogue(
          [
            "Excellent work.",
            "Take this key — it opens gate."
          ],
          () => (this.playerCanMove = true)
        );
      } else {
        // TOGGLE LAYERS AGAIN IF ALREADY HAVE KEY
        if (this.currentMapId === 'map7' && this.language === 'JavaScript') {
          this.openDoors();
        }

        if (this.currentMapId === 'map8' && this.language === 'JavaScript') {
          this.openDoors();
        }

        if (this.currentMapId === 'map15' && this.language === 'JavaScript') {
          this.openGates();
        }

        // TOGGLE LAYERS AGAIN IF ALREADY HAVE KEY
        if (this.currentMapId === 'map10' && this.language === 'JavaScript') {
          this.toggleLayers();
        }

        this.dialogueManager.startDialogue(
          ["You already have key."],
          () => (this.playerCanMove = true)
        );
      }
      return true;
    }

    this.playerCanMove = true;
    return true;
  }

  handleInteract() {
    if (this.isGameplayLocked()) return;

    if (this.tryInteractWithNPC()) return;
    if (this.tryInteractWithChest()) return;
    if (this.tryOpenGate()) return;
    this.tryBreakRock();
  }

  tryBreakRock() {
    if (!this.interactableRockLayer) return;
    if (!this.worldState || !this.worldState.abilities) return;

    const requiredProp =
      this.interactableRockLayer.layer.properties?.find(
        p => p.name === "requires"
      );

    const required = requiredProp?.value;
    if (!this.worldState.abilities.has(required)) return;

    const offsets = {
      up: { x: 0, y: -48 },
      down: { x: 0, y: 16 },
      left: { x: -48, y: 0 },
      right: { x: 48, y: 0 }
    };

    const offset = offsets[this.lastDirection] || { x: 0, y: 0 };

    const checkX = this.player.x + offset.x;
    const checkY = this.player.y + offset.y;

    const tileX = this.interactableRockLayer.worldToTileX(checkX);
    const tileY = this.interactableRockLayer.worldToTileY(checkY);

    const tile = this.interactableRockLayer.getTileAt(tileX, tileY);
    if (!tile) return;

    // 💥 BREAK ROCK
    this.interactableRockLayer.setVisible(false);
    this.interactableRockLayer.forEachTile(tile => {
      tile.setCollision(false);
    });

    if (this.smallRockLayer) {
      this.smallRockLayer.setVisible(true);
    }

  }



  tryInteractWithChest() {
    if (!this.openedChests) return;
    if (!this.chestLayer || !this.chestOpenLayer) return;

    const offsets = [
      { x: 0, y: -24 },
      { x: -24, y: 0 },
      { x: 24, y: 0 },
      { x: 0, y: 24 }
    ];

    for (const offset of offsets) {
      const wx = this.player.x + offset.x;
      const wy = this.player.y + offset.y;

      const tx = this.chestLayer.worldToTileX(wx);
      const ty = this.chestLayer.worldToTileY(wy);

      const tile = this.chestLayer.getTileAt(tx, ty);
      if (!tile || tile.properties?.type !== "chest") continue;

      const questId = tile.properties.quest_id;
      const chestKey = `${this.currentMapId}_${tx}_${ty}`;

      // Already opened
      if (this.openedChests.has(chestKey)) return;

      const quest = this.questManager.getQuestById(questId);
      if (!quest) return;

      // 1️⃣ Quest not started → give quest
      if (!quest.completed && this.questManager.activeQuest?.id !== questId) {
        this.playerCanMove = false;
        this.dialogueManager.startDialogue(quest.dialogue || [], () => {
          this.questManager.startQuest(questId);
          this.playerCanMove = true;
        });
        return;
      }

      // 2️⃣ Quest active but not completed
      if (!quest.completed) {
        this.playerCanMove = false;
        this.dialogueManager.startDialogue(
          ["The chest is sealed by ancient code..."],
          () => (this.playerCanMove = true)
        );
        return;
      }

      // 3️⃣ Quest completed → OPEN CHEST
      this.playerCanMove = false;

      // 🔁 Toggle layers
      this.chestLayer.setVisible(false);
      this.chestLayer.forEachTile(t => t.setCollision(false));

      this.chestOpenLayer.setVisible(true);

      this.dialogueManager.startDialogue(
        [
          "The chest clicks open.",
          "Inside, you find a sturdy Pickaxe.",
          "🪓 You can now break rocks!"
        ],
        () => {
          // Grant ability
          this.worldState.abilities.add(quest.grants);
          // localStorage.setItem(
          //   "abilities",
          //   JSON.stringify([...this.worldState.abilities])
          // );

          // Save opened chest
          this.openedChests.add(chestKey);
          // localStorage.setItem(
          //   "openedChests",
          //   JSON.stringify([...this.openedChests])
          // );

          this.playerCanMove = true;
        }
      );

      return;
    }
  }



  async playIntroCutscene() {
    const key = `${this.language}_${this.currentMapId}_intro`;
    const cutscene = CUTSCENES[key];
    if (!cutscene) return;
    const canSkip = Boolean(CUTSCENE_OPTIONS?.[key]?.showSkipButton);

    this.time.delayedCall(500, async () => {
      // 🔒 Lock player + show cinematic bars
      this.playerCanMove = false;
      this.cinematicBars.show(500);

      if (canSkip) {
        this.createCutsceneSkipButton(() => {
          this.cutsceneManager?.requestSkip?.();
        });
      }

      await this.cutsceneManager.play(cutscene);

      this.destroyCutsceneSkipButton();

      // 🎬 Restore gameplay view
      this.cinematicBars.hide(500);
      this.playerCanMove = true;

      // Quest 1: show lesson header splash after intro
      this.time.delayedCall(300, () => this.maybeShowLessonExampleSplash());
    });
  }

  tryOpenGate() {
    if (!this.gateCloseLayer) return;

    const requiredProp =
      this.gateCloseLayer.layer.properties?.find(
        p => p.name === "requires"
      );

    const requiredKey = requiredProp?.value;
    if (!requiredKey) return;

    // ❌ No key
    if (!this.worldState.abilities.has(requiredKey)) {
      this.dialogueManager.startDialogue(
        ["The gate is locked. You need a key."],
        () => { }
      );
      return;
    }

    // ✅ HAS KEY → OPEN GATE
    this.gateCloseLayer.setVisible(false);
    this.gateCloseLayer.forEachTile(t => t.setCollision(false));

    if (this.gateOpenLayer) {
      this.gateOpenLayer.setVisible(true);
    }

    this.dialogueManager.startDialogue(
      ["You unlock the gate.", "The path is now open."],
      () => { }
    );

  }


  createMapExits() {
    const layer = this.mapLoader.map.getObjectLayer("triggers");
    if (!layer) return;

    this.mapExits = this.physics.add.group();

    layer.objects
      .filter(o =>
        o.properties?.some(p => p.name === "type" && p.value === "map_exit")
      )
      .forEach(obj => {
        const isJavaScript = this.language === "JavaScript";
        const isPoint = Boolean(obj.point) || obj.width === 0 || obj.height === 0;
        const zoneWidth = isJavaScript && isPoint ? 48 : obj.width;
        const zoneHeight = isJavaScript && isPoint ? 48 : obj.height;
        const zoneX = isJavaScript && isPoint ? obj.x : obj.x + obj.width / 2;
        const zoneY = isJavaScript && isPoint ? obj.y : obj.y + obj.height / 2;

        const zone = this.add.zone(zoneX, zoneY, zoneWidth, zoneHeight);

        this.physics.world.enable(zone);
        zone.body.setAllowGravity(false);
        zone.body.setImmovable(true);

        const targetMap =
          obj.properties.find(p => p.name === "target_map")?.value;

        const targetSpawn =
          obj.properties.find(p => p.name === "target_spawn")?.value;

        const rawDirection = obj.properties.find(p => p.name === "direction")?.value;
        const direction = String(rawDirection || "").toLowerCase().trim();
        const validDirections = new Set(["up", "down", "left", "right"]);

        const rawQuest =
          obj.properties.find(p => p.name === "required_quest")?.value;

        const requiredQuestId =
          rawQuest === undefined || rawQuest === null || rawQuest === ""
            ? null
            : Number(rawQuest);

        // If no required quest, exit is open by default
        let unlocked = requiredQuestId === null;

        if (requiredQuestId !== null) {
          unlocked = this.isRequiredQuestSatisfied(requiredQuestId);
        }

        zone.exitData = {
          targetMap,
          targetSpawn,
          requiredQuest: requiredQuestId
        };

        // 🏹 EXIT-ONLY ARROW
        zone.exitArrow = validDirections.has(direction)
          ? this.exitArrowManager.createArrow(
            zone.x,
            zone.y,
            direction,
            unlocked
          )
          : null;

        this.mapExits.add(zone);
      });

    this.physics.add.overlap(
      this.player,
      this.mapExits,
      this.handleMapExit,
      null,
      this
    );
  }




  handleMapExit(player, zone) {
    const { requiredQuest } = zone.exitData;

    // Quest not finished → do nothing
    if (requiredQuest) {
      if (!this.isRequiredQuestSatisfied(requiredQuest)) return;
    }

    // Prevent multiple triggers
    this.physics.world.disable(zone);
    this.playerCanMove = false;

    // Fade out
    this.cameras.main.fadeOut(500, 0, 0, 0); // 500ms fade to black

    this.cameras.main.once("camerafadeoutcomplete", () => {

      if (!this.quest.completed) return;

      // Tell React to navigate
      window.dispatchEvent(
        new CustomEvent("code-mania:request-next-exercise", {
          detail: { exerciseId: this.exerciseId }
        })
      );

    });

  }
}
