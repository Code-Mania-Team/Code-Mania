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
        frames: [{ key: `player-${dir}`, frame: 0 }]
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

    this.lastDirection = "down";

    // 🎬 INTRO
    this.playIntroCutscene();
  }

  update() {
    if (!this.playerCanMove) {
      this.player.setVelocity(0);
      return;
    }

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

        // npc.setDepth(npc.y);

        npc.npcData = {
          questId: Number(
            obj.properties?.find(p => p.name === "quest_id")?.value
          )
        };

        this.npcs.push(npc);
      });
  }

  getSpawnPoint(name) {
    const layer = this.mapLoader.map.getObjectLayer("spawn");
    const obj = layer?.objects.find(o => o.name === name);

    return obj
      ? { x: obj.x + obj.width / 2, y: obj.y - obj.height / 2 }
      : { x: 100, y: 100 };
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

}
