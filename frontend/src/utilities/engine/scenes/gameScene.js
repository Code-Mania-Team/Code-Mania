import Phaser from "phaser";
import MapLoader from "../MapLoader";
import { MAPS } from "../config/mapConfig";
import QuestManager from "../systems/questManager";
import DialogueManager from "../systems/dialogueManager";
import CutsceneManager from "../systems/cutSceneManager";
import { CUTSCENES } from "../config/cutSceneConfig";
import pythonQuests from "../../data/pythonExercises.json";
import jsQuests from "../../data/javascriptExercises.json";
import cppQuests from "../../data/cppExercises.json";
import { CHARACTERS } from "../config/characterConfig";
import QuestHUD from "../systems/questHUD";
import ExitArrowManager from "../systems/exitArrowHUD";
import QuestIconManager from "../systems/questIconManager";
// import { worldState } from "../systems/worldState";
import ChestQuestManager from "../systems/chestQuestManager";
import HelpManager from "../systems/helpManager";
import HelpButton from "../ui/helpButton";
import QuestCompleteToast from "../ui/QuestCompleteToast";
import BadgeUnlockPopup from "../ui/badgeUnlockPopup";
import { BADGES } from "../config/badgeConfig";
import CinematicBars from "../systems/cinematicBars";
import OrientationManager from "../systems/orientationManager";
import MobileControls from "../systems/mobileControls";
import QuestValidator from "../systems/questValidator";
export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    // Use the last course title from localStorage if available
    const storedLanguage = localStorage.getItem("lastCourseTitle") || "Python";
    
    // Map language names to MAPS keys
    this.language = storedLanguage === "C++" ? "Cpp" : storedLanguage;

    // Map ID passed from previous scene, or fall back to localStorage, or default to map1
    const storedMapId = localStorage.getItem("currentMapId");
    this.currentMapId = data?.mapId || storedMapId || "map1";

    // Access mapData based on language
    this.mapData = MAPS[this.language][this.currentMapId];

    this.playerCanMove = true;
    this.helpShownThisSession = false;
    this.gamePausedByTerminal = false;
    // this.openedChests = new Set(
    //   JSON.parse(localStorage.getItem("openedChests") || "[]")
    // );

    // const savedAbilities = JSON.parse(
    //   localStorage.getItem("abilities") || "[]"
    // );
    // this.worldState = {
    //   abilities: new Set(savedAbilities)
    // };
    this.worldState = {
      abilities: new Set()
    };

    this.openedChests = new Set();

  }

  preload() {
    this.mapLoader = new MapLoader(this);
    this.mapLoader.load(
      this.mapData.mapKey,
      this.mapData.mapJson,
      this.mapData.tilesets
    );

    const selectedId = Number(localStorage.getItem("selectedCharacter")) || 0;
    const character =
      CHARACTERS.find(c => c.id === selectedId) || CHARACTERS[0];

    Object.entries(character.sprites).forEach(([dir, path]) => {
      this.load.spritesheet(`player-${dir}`, path, {
        frameWidth: 48,
        frameHeight: 48
      });
    });

    Object.values(BADGES).forEach(badge => {
      this.load.image(badge.key, badge.path);
    });

    this.load.spritesheet("npc-villager", "/assets/npcs/npc1.png", {
      frameWidth: 48,
      frameHeight: 48
    });

    this.load.spritesheet("arrow_up", "/assets/ui/arrow_up.png", {
      frameWidth: 48,
      frameHeight: 48
    });

    this.load.spritesheet("arrow_down", "/assets/ui/arrow_down.png", {
      frameWidth: 48,
      frameHeight: 48
    });

    this.load.spritesheet("arrow_left", "/assets/ui/arrow_left.png", {
      frameWidth: 48,
      frameHeight: 48
    });

    this.load.spritesheet("arrow_right", "/assets/ui/arrow_right.png", {
      frameWidth: 48,
      frameHeight: 48
    });
    this.load.spritesheet("quest_icon", "/assets/ui/quest_icon.png", {
      frameWidth: 48,
      frameHeight: 48 
    });
    this.load.spritesheet("exclamation", "/assets/ui/exclamation.png", {
      frameWidth: 48,
      frameHeight: 48
    });

  }
  onQuestComplete = (e) => {
    const questId = e.detail?.questId;
    if (!questId) return;

    const quest = this.questManager.getQuestById(questId);
    if (!quest) return;

    const gainedExp = quest.experience || 0;

    // 🎒 Grant ability (if any)
    if (quest.grants) {
      this.worldState.abilities.add(quest.grants);
    }

    // ✅ ALWAYS show quest completed toast
    this.questCompleteToast.show({
      title: quest.title,
      badgeKey: quest.badgeKey || null, // toast can ignore if null
      exp: gainedExp
    });

    // 🏅 ONLY show badge UI if quest has badge
    if (quest.badgeKey) {
      const badge = BADGES[quest.badgeKey];
      if (!badge) return;

      this.badgeUnlockPopup.show({
        badgeKey: badge.key,
        label: quest.title
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

    // 🎵 Background music removed

    // 🎮 PLAYER ANIMATIONS
    const selectedId = Number(localStorage.getItem("selectedCharacter")) || 0;
    
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
          end: 3
        }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: `idle-${dir}`,
        frames: [{ key: `player-${dir}`, frame: idleFrame }]
      });
    });

    ["up", "down", "left", "right"].forEach(dir => {
      if (this.anims.exists(`arrow-${dir}`)) return;

      this.anims.create({
        key: `arrow-${dir}`,
        frames: this.anims.generateFrameNumbers(`arrow_${dir}`, {
          start: 0,
          end: 3
        }),
        frameRate: 6,
        repeat: -1
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
    const spawn = this.getSpawnPoint("player_spawn");
    this.player = this.physics.add.sprite(spawn.x, spawn.y, "player-down");

    // 👣 FEET-BASED SETUP (CRITICAL)
    this.player.setOrigin(0.5, 1);
    this.player.body.setSize(32, 16);
    this.player.body.setOffset(8, 32);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(100);

    // 🧱 COLLISIONS
    this.mapLoader.collisionLayers.forEach(layer => {
      this.physics.add.collider(this.player, layer);
    });

    // ⌨ INPUT — ONLY ONCE
    this.cursors = this.input.keyboard.createCursorKeys();
    // 🔓 FREE SPACEBAR FOR THE BROWSER / TERMINAL
    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);


    // ✅ LETTER KEYS — EVENT BASED (DO NOT BLOCK TERMINAL)
    this.input.keyboard.on("keydown-E", () => {
      this.handleInteract();
    });

    // this.input.on("pointerdown", (pointer) => {
    //   // left click or tap
    //   if (pointer.button !== 0) return;

    //   this.handleInteract();
    // });

    this.input.keyboard.on("keydown-Q", () => {
      if (this.gamePausedByTerminal) return;
      this.questHUD.toggle(this.questManager.activeQuest);
    });

    this.input.keyboard.on("keydown-H", () => {
      if (this.gamePausedByTerminal) return;
      this.helpManager.openHelp();
    });
    
    this.input.keyboard.on("keydown-T", () => {
      if (this.gamePausedByTerminal) return;
      const activeQuest = this.questManager.activeQuest;
      if (activeQuest) {
        this.questManager.completeQuest(activeQuest.id);
        console.log("🧪 TEST MODE: Quest completed:", activeQuest.id);
      }
    });

    // 🔒 TERMINAL EVENTS
    window.addEventListener("code-mania:terminal-active", () => {
      this.gamePausedByTerminal = true;
      this.player.setVelocity(0);
    });

    window.addEventListener("code-mania:terminal-inactive", () => {
      this.gamePausedByTerminal = false;
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
      QUESTS_BY_LANGUAGE[this.language]
    );

    this.dialogueManager = new DialogueManager(this);
    this.cutsceneManager = new CutsceneManager(this);
    this.exitArrowManager = new ExitArrowManager(this);
    this.questIconManager = new QuestIconManager(this);
    this.chestQuestManager = new ChestQuestManager(this);
    this.helpManager = new HelpManager(this);
    this.questValidator = new QuestValidator(this);
    this.questCompleteToast = new QuestCompleteToast(this);
    this.badgeUnlockPopup = new BadgeUnlockPopup(this);
    this.cinematicBars = new CinematicBars(this);


    this.isMobile =
      this.sys.game.device.os.android ||
      this.sys.game.device.os.iOS;

    if (this.isMobile) {
      this.mobileControls = new MobileControls(this, {
      onInteract: () => this.handleInteract()
    });

    }

    this.orientationManager = new OrientationManager(this);
    this.scale.on("resize", () => {
      this.cinematicBars.resize();
    });
    

    // ✅ QUEST COMPLETE EVENT (AFTER SYSTEMS EXIST)
    window.addEventListener(
      "code-mania:quest-complete",
      this.onQuestComplete
    );

    this.events.once("shutdown", () => {
      window.removeEventListener(
        "code-mania:quest-complete",
        this.onQuestComplete
      );
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
    this.spawnChestQuestIcons();

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


  update() {
    if (this.gamePausedByTerminal) {
      this.player.setVelocity(0);
      this.player.anims.stop();
      return;
    }

    const speed = 200;
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
          questId: Number(
            obj.properties?.find(p => p.name === "quest_id")?.value
          )
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
      this.dialogueManager.startDialogue(
        quest.dialogue || [],
        () => {
          this.questManager.startQuest(quest.id);
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

    // 3️⃣ QUEST COMPLETED → GIVE KEY
    if (quest.completed && quest.grants) {
      if (!this.worldState.abilities.has(quest.grants)) {
        this.worldState.abilities.add(quest.grants);

        this.dialogueManager.startDialogue(
          [
            "Excellent work.",
            "Take this key — it opens the gate."
          ],
          () => (this.playerCanMove = true)
        );
      } else {
        this.dialogueManager.startDialogue(
          ["You already have the key."],
          () => (this.playerCanMove = true)
        );
      }
      return true;
    }

    this.playerCanMove = true;
    return true;
  }

  handleInteract() {
    if (this.gamePausedByTerminal) return;

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

    console.log("🪨 Rocks broken!");
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
          console.log("🧰 Pickaxe obtained!");
        }
      );

      return;
    }
  }



  async playIntroCutscene() {
    const key = `${this.language}_${this.currentMapId}_intro`;
    const cutscene = CUTSCENES[key];
    if (!cutscene) return;

    this.time.delayedCall(500, async () => {
      // 🔒 Lock player + show cinematic bars
      this.playerCanMove = false;
      this.cinematicBars.show(500);

      await this.cutsceneManager.play(cutscene);

      // 🎬 Restore gameplay view
      this.cinematicBars.hide(500);
      this.playerCanMove = true;
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
        () => {}
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
      () => {}
    );

    console.log("🚪 Gate opened!");
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

        const direction =
          obj.properties.find(p => p.name === "direction")?.value ?? "down";

        const rawQuest =
          obj.properties.find(p => p.name === "required_quest")?.value;

        // 🔒 LOCKED BY DEFAULT
        let unlocked = false;

        if (rawQuest !== undefined) {
          const quest = this.questManager.getQuestById(Number(rawQuest));
          unlocked = !!quest?.completed;
        }

        zone.exitData = {
          targetMap,
          requiredQuest: rawQuest
        };

        // 🏹 EXIT-ONLY ARROW
        zone.exitArrow = this.exitArrowManager.createArrow(
          zone.x,
          zone.y,
          direction,
          unlocked
        );

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
    const { targetMap, requiredQuest } = zone.exitData;

    // Quest not finished → do nothing
    if (requiredQuest) {
      const quest = this.questManager.getQuestById(requiredQuest);
      if (!quest || !quest.completed) return;
    }

    // Prevent multiple triggers
    this.physics.world.disable(zone);
    this.playerCanMove = false;

    // Fade out
    this.cameras.main.fadeOut(500, 0, 0, 0); // 500ms fade to black

    this.cameras.main.once("camerafadeoutcomplete", () => {
    localStorage.setItem("currentMapId", targetMap);

    this.scene.start("GameScene", {
      mapId: targetMap
    });

    });
  }
}
