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

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    // Use the last course title from localStorage if available
    this.language = localStorage.getItem("lastCourseTitle") || "Python";

    // Map ID passed from previous scene, or default to map1
    this.currentMapId = data?.mapId || "map1";

    // Access mapData based on language
    this.mapData = MAPS[this.language][this.currentMapId];

    this.playerCanMove = true;
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

    this.load.spritesheet("npc-villager", "/assets/npcs/npc1.png", {
      frameWidth: 48,
      frameHeight: 48
    });
  }

  create() {
    // 🗺 MAP
    this.mapLoader.create(this.mapData.mapKey, this.mapData.tilesets);

    this.textures.each(t =>
      t.setFilter(Phaser.Textures.FilterMode.NEAREST)
    );

    this.cameras.main.roundPixels = true;

    // 🎞 PLAYER ANIMATIONS
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

    // 🧑 NPCs
    this.spawnNPCs();
    this.npcs.forEach(npc => {
      this.physics.add.collider(this.player, npc);
    });

    this.createInteractionMarker();

    // 🌍 CAMERA
    const w = this.mapLoader.map.widthInPixels;
    const h = this.mapLoader.map.heightInPixels;

    this.physics.world.setBounds(0, 0, w, h);
    this.cameras.main.setBounds(0, 0, w, h);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // ⌨ INPUT
    this.cursors = this.input.keyboard.createCursorKeys();
    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );
    this.questKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.Q
    );
    this.testCompleteKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.T
    );
    

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
    this.createMapExits();
    this.lastDirection = "down";

    // 🎬 INTRO
    this.playIntroCutscene();
  }

  update() {
    if (!this.playerCanMove) {
      this.player.setVelocity(0);
      return;
    }

    this.updateInteractionMarker();

    const speed = 120;
    this.player.setVelocity(0);

    let moving = false;

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

    const anim = moving
      ? `walk-${this.lastDirection}`
      : `idle-${this.lastDirection}`;
    this.player.anims.play(anim, true);

    // 🧠 DEPTH SORT (MAGIC LINE)
    // this.player.setDepth(this.player.y);

    // this.npcs.forEach(npc => npc.setDepth(npc.y));

    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.tryInteractWithNPC();
    }

    if (Phaser.Input.Keyboard.JustDown(this.questKey)) {
      this.questHUD.toggle(this.questManager.activeQuest);
    }
    if (Phaser.Input.Keyboard.JustDown(this.testCompleteKey)) {
      this.questManager.completeQuest(1);
      console.log("🧪 TEST MODE: Quest 1 completed");
    }
  }

  spawnNPCs() {
    const layer = this.mapLoader.map.getObjectLayer("spawn");
    if (!layer) return;

    this.npcs = [];

    layer.objects
      .filter(o => o.name === "npc_spawn")
      .forEach(obj => {
        const npc = this.physics.add.sprite(
          obj.x + obj.width / 2,
          obj.y - obj.height / 2,
          "npc-villager"
        );

        npc.setOrigin(0.5, 1);
        npc.body.setSize(32, 16);
        npc.body.setOffset(8, 32);
        npc.body.immovable = true;
        
        // Only hide NPC sprite for JavaScript (keep visible for Python/C++)
        if (this.language === "JavaScript") {
          npc.setVisible(false);
        }

        // npc.setDepth(npc.y);

        npc.npcData = {
          questId: Number(
            obj.properties?.find(p => p.name === "quest_id")?.value
          )
        };

        this.npcs.push(npc);
      });
  }

  createInteractionMarker() {
    this.interactionMarker = this.add.container(0, 0).setDepth(999);

    const arrow = this.add.triangle(0, 0, 0, 0, 18, 0, 9, 16, 0xffd200, 1);
    const label = this.add.text(0, -16, "GO", {
      font: "16px Arial",
      fill: "#ffd200",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);

    this.interactionMarker.add([label, arrow]);
    this.interactionMarker.setVisible(false);

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
    if (!npc) return;

    this.interactionMarker?.setVisible(false);
    this.interactPrompt?.setVisible(false);

    const quest = this.questManager.getQuestById(npc.npcData.questId);
    if (!quest) return;

    this.playerCanMove = false;

    this.dialogueManager.startDialogue(quest.dialogue || [], () => {
      this.questManager.startQuest(quest.id);
      this.playerCanMove = true;
    });
  }

  playIntroCutscene() {
    const key = `${this.language}_${this.currentMapId}_intro`;
    const cutscene = CUTSCENES[key];
    if (!cutscene) return;

    this.time.delayedCall(500, async () => {
      await this.cutsceneManager.play(cutscene);
      localStorage.setItem(`cutscene_${key}`, "true");
    });
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
        const zone = this.add.zone(
          obj.x + obj.width / 2,
          obj.y + obj.height / 2,
          obj.width,
          obj.height
        );

        this.physics.world.enable(zone);
        zone.body.setAllowGravity(false);
        zone.body.setImmovable(true);

        zone.exitData = {
          targetMap: obj.properties.find(p => p.name === "target_map")?.value,
          requiredQuest: obj.properties.find(p => p.name === "required_quest")?.value
        };

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
      // Start next map scene
      this.scene.start("GameScene", {
        mapId: targetMap
      });

      // Optional: you can fade in the next scene after a short delay
      // But better to do it in the new scene's create()
    });
  }



}
