import Phaser from "phaser";
import MapLoader from "../MapLoader";
import { MAPS } from "../config/mapConfig";
import DialogueManager from "../systems/dialogueManager";
import QuestManager from "../systems/questManager";
import quests from "../../data/pythonExercises.json";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.currentMapId = data.mapId || "map1";
    this.mapData = MAPS[this.currentMapId];
    this.playerCanMove = true;
  }

  preload() {
    this.mapLoader = new MapLoader(this);
    this.mapLoader.load(
      this.mapData.mapKey,
      this.mapData.mapJson,
      this.mapData.tilesets
    );

    ["down", "up", "left", "right"].forEach(dir => {
      this.load.spritesheet(`player-${dir}`, `/assets/walk${dir}-Sheet.png`, {
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
    this.mapLoader.create(this.mapData.mapKey, this.mapData.tilesets);

    this.textures.each(t =>
      t.setFilter(Phaser.Textures.FilterMode.NEAREST)
    );
    this.cameras.main.roundPixels = true;

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

    const spawn = this.getSpawnPoint("player_spawn");
    this.player = this.physics.add.sprite(
      spawn.x,
      spawn.y,
      "player-down"
    );
    this.player.body.setSize(48, 48);
    this.player.setCollideWorldBounds(true);

    this.mapLoader.collisionLayers.forEach(layer => {
      this.physics.add.collider(this.player, layer);
    });

    this.spawnNPCs();
    this.npcs.forEach(npc =>
      this.physics.add.collider(this.player, npc)
    );

    const w = this.mapLoader.map.widthInPixels;
    const h = this.mapLoader.map.heightInPixels;

    this.physics.world.setBounds(0, 0, w, h);
    this.cameras.main.setBounds(0, 0, w, h);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.lastDirection = "down";

    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );

    // 🔥 Managers
    this.dialogueManager = new DialogueManager(this);
    this.questManager = new QuestManager(this, quests);
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

        // ✅ FIXED: questId naming
        npc.npcData = {
          questId: Number(props.quest_id)
        };

        this.npcs.push(npc);
      });
  }

  getSpawnPoint(name) {
    const layer = this.mapLoader.map.getObjectLayer("spawn");
    const obj = layer?.objects.find(o => o.name === name);
    if (!obj) return { x: 100, y: 100 };

    return {
      x: obj.x + obj.width / 2,
      y: obj.y - obj.height / 2
    };
  }

  update() {
    this.dialogueManager.update();
    if (!this.playerCanMove) return;

    const cursors = this.input.keyboard.createCursorKeys();
    const speed = 120;
    this.player.setVelocity(0);

    let moving = false;

    if (cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.lastDirection = "left";
      moving = true;
    } else if (cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.lastDirection = "right";
      moving = true;
    }

    if (cursors.up.isDown) {
      this.player.setVelocityY(-speed);
      this.lastDirection = "up";
      moving = true;
    } else if (cursors.down.isDown) {
      this.player.setVelocityY(speed);
      this.lastDirection = "down";
      moving = true;
    }

    this.player.anims.play(
      moving
        ? `walk-${this.lastDirection}`
        : `idle-${this.lastDirection}`,
      true
    );

    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.tryInteractWithNPC();
    }
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

    const questId = npc.npcData.questId;
    const quest = this.questManager.getQuestById(questId);
    if (!quest) return;

    this.playerCanMove = false;

    // 💬 Dialogue FIRST → then quest + show scroll
    this.dialogueManager.startDialogue(
      quest.dialogue,
      () => {
        this.playerCanMove = true;

        // 🔹 Show the scroll with the quest info
        const scroll = document.querySelector(".scroll-container");
        if (scroll) {
          scroll.style.display = "block"; // or "block" depending on your layout
        }

        this.questManager.triggerQuestFromNPC(questId);
      }
    );
  }

}
