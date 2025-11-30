import Phaser from "phaser";
import MapLoader from "./MapLoader";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.mapLoader = new MapLoader(this);

    // Load your map and tileset
    this.mapLoader.load(
      "map1",
      "/assets/maps/map1.json",
      "Tileset - Copy",
      "/assets/tilesets/Tileset - Copy.png"
    );

    // Player sprite - load as spritesheet with frame dimensions
    this.load.spritesheet("player", "/assets/walkdown-Sheet.png", {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create() {
    // Create the tilemap
    this.mapLoader.create("map1", "Tileset - Copy", "Tileset - Copy");

    // Fix texture filtering for ALL textures (prevents black lines)
    this.textures.each((texture) => {
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    });
    this.cameras.main.roundPixels = true;

    // Set world bounds to map size
    this.physics.world.setBounds(0, 0, this.mapLoader.map.widthInPixels, this.mapLoader.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.mapLoader.map.widthInPixels, this.mapLoader.map.heightInPixels);
    

    // Get collision layer
    const foreground = this.mapLoader.layers["foreground"];
    if (foreground) {
      foreground.setCollisionByProperty({ collides: true });

      // Debug collisions
      const debugGraphics = this.add.graphics().setAlpha(0.5)
      foreground.renderDebug(debugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
      });
    }

    // Create walking animation
    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 4 }),
      frameRate: 10,
      repeat: -1
    });

    // Create idle animation (just first frame)
    this.anims.create({
      key: 'idle',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 1
    });

    // Add player
    this.player = this.physics.add.sprite(32, 32, "player", 0);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, foreground);

    // Camera follows player with smooth lerp
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    
    // Initial scale setup
    this.updateScale(this.scale.width, this.scale.height);
  }

  updateScale(containerWidth, containerHeight) {
    if (!this.mapLoader.map || !this.mapLoader.layers) return;

    const layers = Object.values(this.mapLoader.layers).filter(Boolean);
    if (layers.length === 0) return;

    const mapWidth = this.mapLoader.map.widthInPixels;
    const mapHeight = this.mapLoader.map.heightInPixels;

    // Calculate scale to fill container (use max to fill, min to fit)
    const scaleX = containerWidth / mapWidth;
    const scaleY = containerHeight / mapHeight;
    const scale = Math.max(scaleX, scaleY); // Use max to fill entire container

    // Scale all layers
    layers.forEach((layer) => {
      layer.setScale(scale);
      // Ensure pixel-perfect rendering
      layer.setPosition(0, 0);
    });

    // Scale player
    if (this.player) {
      this.player.setScale(scale * 0.8); // Reduced from 1.5 to 0.8 for a smaller character
      this.player.body.setSize(32, 32);
    }

    // Update physics world and camera bounds
    const scaledWidth = mapWidth * scale;
    const scaledHeight = mapHeight * scale;
    this.physics.world.setBounds(0, 0, scaledWidth, scaledHeight);
    this.cameras.main.setBounds(0, 0, scaledWidth, scaledHeight);
    
    // Keep camera following player
    if (this.player && !this.cameras.main._follow) {
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }
  }


  update() {
    if (!this.player) return;

    const speed = 100;
    const cursors = this.input.keyboard.createCursorKeys();

    this.player.setVelocity(0);

    let isMoving = false;

    if (cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      isMoving = true;
    }
    if (cursors.right.isDown) {
      this.player.setVelocityX(speed);
      isMoving = true;
    }
    if (cursors.up.isDown) {
      this.player.setVelocityY(-speed);
      isMoving = true;
    }
    if (cursors.down.isDown) {
      this.player.setVelocityY(speed);
      isMoving = true;
    }

    // Play animation based on movement
    if (isMoving) {
      this.player.anims.play('walk', true);
    } else {
      this.player.anims.play('idle', true);
    }
  }
}
