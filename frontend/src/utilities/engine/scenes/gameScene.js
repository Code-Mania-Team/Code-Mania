import Phaser from "phaser";
import MapLoader from "../MapLoader";
import { MAPS } from "../config/mapConfig";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.currentMapId = data.mapId || "map1";
    this.mapData = MAPS[this.currentMapId];
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

    // Load directional player spritesheets
    this.load.spritesheet("player-down", "/assets/walkdown-Sheet.png", { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("player-up", "/assets/walkup-Sheet.png", { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("player-left", "/assets/walkleft-Sheet.png", { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("player-right", "/assets/walkright-Sheet.png", { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    // Create map
    this.mapLoader.create(this.mapData.mapKey, this.mapData.tilesetName, this.mapData.tilesetKey);

    // Pixel-perfect
    this.textures.each((t) => t.setFilter(Phaser.Textures.FilterMode.NEAREST));
    this.cameras.main.roundPixels = true;

    // Collision layer
    const foreground = this.mapLoader.layers["Foreground"];
    if (foreground) foreground.setCollisionByProperty({ collision: true });

    // Animations
    const directions = ["down", "up", "left", "right"];
    directions.forEach((dir) => {
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
    this.player = this.physics.add.sprite(this.mapData.start.x, this.mapData.start.y, "player-down", 0);
    this.player.setCollideWorldBounds(true);

    // Shrink player hitbox for tighter collisions
    this.player.body.setSize(this.player.width * 0.6, this.player.height * 0.6, true);

    // Collider
    this.physics.add.collider(this.player, foreground);

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Track last direction
    this.lastDirection = "down";

    // Initial scale
    this.updateScale(this.scale.width, this.scale.height);

    // Map switching
    this.events.on("exerciseComplete", () => {
      if (this.mapData.nextMap) {
        this.scene.start("GameScene", { mapId: this.mapData.nextMap });
      }
    });
  }

  updateScale(w, h) {
    if (!this.mapLoader.map || !this.mapLoader.layers) return;

    const layers = Object.values(this.mapLoader.layers);
    const mapWidth = this.mapLoader.map.widthInPixels;
    const mapHeight = this.mapLoader.map.heightInPixels;
    const scale = Math.max(w / mapWidth, h / mapHeight);

    // Scale visual layers
    layers.forEach((layer) => layer.setScale(scale));

    // Scale player
    if (this.player) {
      this.player.setScale(scale * 0.8);

      // Adjust hitbox to match sprite
      this.player.body.setSize(
        this.player.width * 0.6,
        this.player.height * 0.6,
        true
      );
    }

    // Update physics bounds
    this.physics.world.setBounds(0, 0, mapWidth * scale, mapHeight * scale);
    this.cameras.main.setBounds(0, 0, mapWidth * scale, mapHeight * scale);
  }

  update() {
    if (!this.player) return;

    const speed = 100;
    const cursors = this.input.keyboard.createCursorKeys();

    this.player.setVelocity(0);
    let moving = false;

    // Horizontal movement
    if (cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.lastDirection = "left";
      moving = true;
    } else if (cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.lastDirection = "right";
      moving = true;
    }

    // Vertical movement
    if (cursors.up.isDown) {
      this.player.setVelocityY(-speed);
      this.lastDirection = "up";
      moving = true;
    } else if (cursors.down.isDown) {
      this.player.setVelocityY(speed);
      this.lastDirection = "down";
      moving = true;
    }

    // Play proper animation
    if (moving) {
      this.player.anims.play(`walk-${this.lastDirection}`, true);
    } else {
      this.player.anims.play(`idle-${this.lastDirection}`, true);
    }
  }
}
