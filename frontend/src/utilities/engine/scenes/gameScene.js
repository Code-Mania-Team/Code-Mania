import Phaser from "phaser";
import MapLoader from "../MapLoader";
import { MAPS } from "../config/mapConfig";
import QuestManager from "../systems/questManager";
import DialogueManager from "../systems/dialogueManager";
import CutsceneManager from "../systems/cutSceneManager";
import { CUTSCENES } from "../config/cutSceneConfig";
import quests from "../../data/pythonExercises.json";
import { CHARACTERS } from "../config/characterConfig";
import QuestHUD from "../systems/questHUD";


export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    // ⚠️ MUST MATCH cutscene key: map1_intro
    this.currentMapId = data?.mapId || "map1";
    this.mapData = MAPS[this.currentMapId];

    if (!this.mapData) {
      console.error("❌ Map not found:", this.currentMapId);
    }

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
    const character = CHARACTERS.find(c => c.id === selectedId) || CHARACTERS[0];

    Object.entries(character.sprites).forEach(([dir, path]) => {
      this.load.spritesheet(`player-${dir}`, path, {
        frameWidth: 48,
        frameHeight: 48
      });
    });

    this.load.spritesheet("npc-villager", "/assets/npcs/npc1.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
  }

  create() {
    // 🗺 Map
    this.mapLoader.create(this.mapData.mapKey, this.mapData.tilesets);
    this.textures.each(t =>
      t.setFilter(Phaser.Textures.FilterMode.NEAREST)
    );

    this.cameras.main.roundPixels = true;

    // 🎞 Player animations
    ["down", "up", "left", "right"].forEach(dir => {
      this.anims.create({
        key: `walk-${dir}`,
        frames: this.anims.generateFrameNumbers(`player-${dir}`, { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
      });

      this.anims.create({
        key: `idle-${dir}`,
        frames: [{ key: `player-${dir}`, frame: 0 }],
      });
    });

    // 🧍 Player spawn
    const spawn = this.getSpawnPoint("player_spawn");
    this.player = this.physics.add.sprite(spawn.x, spawn.y, "player-down");
    this.player.body.setSize(48, 48);
    this.player.setCollideWorldBounds(true);

    // 🧱 Collisions
    this.mapLoader.collisionLayers.forEach(layer => {
      this.physics.add.collider(this.player, layer);
    });

    // 🧑 NPCs
    this.spawnNPCs();
    this.npcs.forEach(npc => {
      this.physics.add.collider(this.player, npc);
    });

    // 🌍 World bounds & camera
    const w = this.mapLoader.map.widthInPixels;
    const h = this.mapLoader.map.heightInPixels;

    this.physics.world.setBounds(0, 0, w, h);
    this.cameras.main.setBounds(0, 0, w, h);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.lastDirection = "down";

    // ⌨ Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );
    this.questHUD = new QuestHUD(this);

    // Q key to open quest scroll 📜
    this.questKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.Q
    );


    // 🧠 Systems
    this.questManager = new QuestManager(this, quests);
    this.dialogueManager = new DialogueManager(this);
    this.cutsceneManager = new CutsceneManager(this);

    // 🎬 Intro cutscene
    this.playIntroCutscene();
  }

  // 🎬 INTRO CUTSCENE
  playIntroCutscene() {
    const key = `${this.currentMapId}_intro`;
    const cutscene = CUTSCENES[key];

    console.log("🎬 Cutscene key:", key);
    console.log("🎬 Cutscene data:", cutscene);

    if (!cutscene) return;

    // ❗ Disable while testing
    // if (localStorage.getItem(`cutscene_${key}`)) return;

    this.time.delayedCall(500, async () => {
      console.log("▶ Starting cutscene");
      await this.cutsceneManager.play(cutscene);
      console.log("▶ Cutscene finished");

      localStorage.setItem(`cutscene_${key}`, "true");
    });
  }

  spawnNPCs() {
    const layer = this.mapLoader.map.getObjectLayer("spawn");
    if (!layer) return;

    this.npcs = [];

    layer.objects
      .filter(o => o.name === "npc_spawn")
      .forEach(obj => {
        const props = Object.fromEntries(
          (obj.properties || []).map(p => [p.name, p.value])
        );

        const npc = this.physics.add.sprite(
          obj.x + obj.width / 2,
          obj.y - obj.height / 2,
          "npc-villager"
        );

        npc.body.setSize(48, 48);
        npc.body.immovable = true;
        npc.npcData = {
          questId: Number(props.quest_id)
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

    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.tryInteractWithNPC();
    }
    if (Phaser.Input.Keyboard.JustDown(this.questKey)) {
      this.questHUD.toggle(this.questManager.activeQuest);
    }
  }

  tryInteractWithNPC() {
    const npc = this.npcs.find(n =>
      Phaser.Math.Distance.Between(this.player.x, this.player.y, n.x, n.y) <= 50
    );
    if (!npc) return;

    const questId = npc.npcData.questId;
    const quest = this.questManager.getQuestById(questId);
    if (!quest) return;

    // Lock player
    this.playerCanMove = false;

    // Start quest dialogue via DialogueManager
    if (quest.dialogue && quest.dialogue.length > 0) {
      this.dialogueManager.startDialogue(quest.dialogue, () => {
        // After dialogue ends, start quest
        this.questManager.startQuest(questId);
        this.playerCanMove = true;
      });
    } else {
      // No dialogue → start quest immediately
      this.questManager.startQuest(questId);
      this.playerCanMove = true;
    }
  }
}
