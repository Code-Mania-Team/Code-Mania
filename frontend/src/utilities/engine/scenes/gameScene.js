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

    this.cursors = this.input.keyboard.createCursorKeys();
    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );

    this.mobileMove = { dx: 0, dy: 0 };
    this.handleMobileMove = (event) => {
      const dx = Number(event?.detail?.dx);
      const dy = Number(event?.detail?.dy);

      this.mobileMove = {
        dx: Number.isFinite(dx) ? Math.max(-1, Math.min(1, dx)) : 0,
        dy: Number.isFinite(dy) ? Math.max(-1, Math.min(1, dy)) : 0,
      };
    };

    this.handleMobileAction = (event) => {
      const action = event?.detail?.action;
      if (action !== "interact") return;

      if (this.dialogueManager?.active) {
        this.dialogueManager.next();
        return;
      }

      if (this.playerCanMove) {
        this.tryInteractWithNPC();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("code-mania:mobile-move", this.handleMobileMove);
      window.addEventListener(
        "code-mania:mobile-action",
        this.handleMobileAction
      );
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "code-mania:mobile-move",
          this.handleMobileMove
        );
        window.removeEventListener(
          "code-mania:mobile-action",
          this.handleMobileAction
        );
      }
    });

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

    const cursors = this.cursors;
    const speed = 120;
    const dx = this.mobileMove?.dx || 0;
    const dy = this.mobileMove?.dy || 0;

    let velX = 0;
    let velY = 0;
    let moving = false;

    if (cursors.left.isDown || dx < 0) {
      velX = -speed;
      this.lastDirection = "left";
      moving = true;
    } else if (cursors.right.isDown || dx > 0) {
      velX = speed;
      this.lastDirection = "right";
      moving = true;
    }

    if (cursors.up.isDown || dy < 0) {
      velY = -speed;
      this.lastDirection = "up";
      moving = true;
    } else if (cursors.down.isDown || dy > 0) {
      velY = speed;
      this.lastDirection = "down";
      moving = true;
    }

    this.player.setVelocity(velX, velY);

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

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("code-mania:dialogue-complete", {
              detail: { questId }
            })
          );
        }
      }
    );
  }

}
