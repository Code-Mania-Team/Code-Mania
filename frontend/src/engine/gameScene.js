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

    // Player sprite
    this.load.image("player", "/assets/walkdown-Sheet.png");
  }

  create() {
    // Create the tilemap
    this.mapLoader.create("map1", "Tileset - Copy", "Tileset - Copy");

    // Fix texture filtering (prevents black lines)
    this.textures.get("Tileset - Copy").setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.cameras.main.roundPixels = true;

    // Camera settings (so map fits window)
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

    // Add player
    this.player = this.physics.add.sprite(32, 32, "player");
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, foreground);

    // Camera follows player
    this.cameras.main.startFollow(this.player);
    this.updateScale(this.scale.width, this.scale.height);
  }

  updateScale(containerWidth, containerHeight) {
    if (!this.mapLoader.map || !this.mapLoader.layers) return;

    const layers = Object.values(this.mapLoader.layers).filter(Boolean); // remove undefined
    if (layers.length === 0) return; // nothing to scale yet

    const mapWidth = this.mapLoader.map.widthInPixels;
    const mapHeight = this.mapLoader.map.heightInPixels;

    const scaleX = containerWidth / mapWidth;
    const scaleY = containerHeight / mapHeight;
    const scale = Math.min(scaleX, scaleY);

    // Scale layers safely
    layers.forEach((layer) => layer.setScale(scale));

    // Scale player
    if (this.player) this.player.setScale(scale);

    // Update camera bounds
    this.cameras.main.setBounds(0, 0, mapWidth * scale, mapHeight * scale);
  }


  update() {
    const speed = 100;
    const cursors = this.input.keyboard.createCursorKeys();

    this.player.setVelocity(0);

    if (cursors.left.isDown) this.player.setVelocityX(-speed);
    if (cursors.right.isDown) this.player.setVelocityX(speed);
    if (cursors.up.isDown) this.player.setVelocityY(-speed);
    if (cursors.down.isDown) this.player.setVelocityY(speed);
  }
}
