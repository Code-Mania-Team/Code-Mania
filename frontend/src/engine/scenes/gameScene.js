// GameScene.js
import Phaser from "phaser";
import MapLoader from "../MapLoader";
import { MAPS } from "../config/mapConfig";
import CutsceneManager from "./cutSceneManager";
import { CUTSCENES } from "../config/cutSceneConfig";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.currentMapId = data.mapId || "map1";
    this.mapData = MAPS[this.currentMapId];
    this.playerCanMove = true; // Flag to block movement during cutscene
  }

  preload() {
    this.mapLoader = new MapLoader(this);

    // Load map
    this.mapLoader.load(
      this.mapData.mapKey,
      this.mapData.mapJson,
      this.mapData.tilesetKey,
      this.mapData.tilesetImage
    );

    // Load player spritesheets
    ["down", "up", "left", "right"].forEach(dir =>
      this.load.spritesheet(`player-${dir}`, `/assets/walk${dir}-Sheet.png`, {
        frameWidth: 32,
        frameHeight: 32,
      })
    );
  }

  create() {
    // Map
    this.mapLoader.create(this.mapData.mapKey, this.mapData.tilesetName, this.mapData.tilesetKey);

    // Pixel-perfect
    this.textures.each(t => t.setFilter(Phaser.Textures.FilterMode.NEAREST));
    this.cameras.main.roundPixels = true;

    // Collision layer
    const foreground = this.mapLoader.layers["Foreground"];
    if (foreground) foreground.setCollisionByProperty({ collision: true });

    // Player animations
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
        frameRate: 1,
      });
    });

    // Player spawn
    this.player = this.physics.add.sprite(this.mapData.start.x, this.mapData.start.y, "player-down");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(this.player.width * 0.6, this.player.height * 0.6, true);
    this.physics.add.collider(this.player, foreground);

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Track last direction
    this.lastDirection = "down";

    // Cutscene manager
    this.cutscene = new CutsceneManager(this);

    // Scale
    this.updateScale(this.scale.width, this.scale.height);

    // Map switching
    this.events.on("exerciseComplete", () => {
      if (this.mapData.nextMap) this.scene.start("GameScene", { mapId: this.mapData.nextMap });
    });

    // Start intro cutscene if exists
    if (CUTSCENES[`${this.currentMapId}_intro`]) {
      this.runCutscene(CUTSCENES[`${this.currentMapId}_intro`](this));
    }
  }

  async runCutscene(actions) {
    this.playerCanMove = false; // Disable player movement
    for (const action of actions) {
      await action();
    }
    this.playerCanMove = true; // Re-enable movement after cutscene
  }

  updateScale(w, h) {
    if (!this.mapLoader.map || !this.mapLoader.layers) return;

    const layers = Object.values(this.mapLoader.layers);
    const scale = Math.max(w / this.mapLoader.map.widthInPixels, h / this.mapLoader.map.heightInPixels);

    layers.forEach(layer => layer.setScale(scale));

    if (this.player) {
      this.player.setScale(scale * 0.8);
      this.player.body.setSize(this.player.width * 0.6, this.player.height * 0.6, true);
    }

    this.physics.world.setBounds(0, 0, this.mapLoader.map.widthInPixels * scale, this.mapLoader.map.heightInPixels * scale);
    this.cameras.main.setBounds(0, 0, this.mapLoader.map.widthInPixels * scale, this.mapLoader.map.heightInPixels * scale);
  }

  update() {
    if (!this.player || !this.playerCanMove) return;

    const cursors = this.input.keyboard.createCursorKeys();
    const speed = 100;

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

    this.player.anims.play(moving ? `walk-${this.lastDirection}` : `idle-${this.lastDirection}`, true);
  }
}
