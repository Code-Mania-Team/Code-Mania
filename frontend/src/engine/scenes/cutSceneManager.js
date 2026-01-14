import Phaser from "phaser";
import EasyStar from "easystarjs";

export default class CutsceneManager {
  constructor(scene) {
    this.scene = scene;
    this.easystar = new EasyStar.js();
    this.played = new Set(); // prevent replay
    this.setupPathfinding();
  }

  setupPathfinding() {
    const map = this.scene.mapLoader.map;
    const layer = this.scene.mapLoader.layers["Foreground"];
    if (!map || !layer) return;

    const grid = [];

    for (let y = 0; y < map.height; y++) {
      const row = [];
      for (let x = 0; x < map.width; x++) {
        const tile = layer.getTileAt(x, y);
        row.push(tile?.properties?.collision ? 1 : 0);
      }
      grid.push(row);
    }

    this.easystar.setGrid(grid);
    this.easystar.setAcceptableTiles([0]);
    this.easystar.enableDiagonals();
  }

  // 🎬 TILE-BASED NPC MOVE
  async moveNPC(npc, targetTileX, targetTileY, speed = 100) {
    const map = this.scene.mapLoader.map;
    const tileSize = map.tileWidth;

    const startX = Math.floor(npc.x / tileSize);
    const startY = Math.floor(npc.y / tileSize);

    const endX = Phaser.Math.Clamp(targetTileX, 0, map.width - 1);
    const endY = Phaser.Math.Clamp(targetTileY, 0, map.height - 1);

    return new Promise(resolve => {
      this.easystar.findPath(startX, startY, endX, endY, path => {
        if (!path) return resolve();

        let index = 0;

        const moveNext = () => {
          if (index >= path.length) return resolve();

          const p = path[index];
          const worldX = p.x * tileSize + tileSize / 2;
          const worldY = p.y * tileSize + tileSize / 2;

          this.faceTowards(npc, worldX, worldY);

          const distance = Phaser.Math.Distance.Between(
            npc.x,
            npc.y,
            worldX,
            worldY
          );

          const duration = (distance / speed) * 1000; // 👈 speed USED clearly

          this.scene.tweens.add({
            targets: npc,
            x: worldX,
            y: worldY,
            duration,
            onComplete: () => {
              index++;
              moveNext();
            },
          });
        };

        moveNext();
      });

      this.easystar.calculate();
    });
  }

  faceTowards(npc, x, y) {
    const dx = x - npc.x;
    const dy = y - npc.y;

    let dir = "down";
    if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? "right" : "left";
    else dir = dy > 0 ? "down" : "up";

    npc.anims.play(`walk-${dir}`, true);
  }

  // 📍 CHECK TILE-BASED CUTSCENE TRIGGERS
  checkTriggers(player) {
    const map = this.scene.mapLoader.map;
    const layer = map.getObjectLayer("cutscenes");
    if (!layer) return;

    layer.objects.forEach(obj => {
      if (this.played.has(obj.name)) return;

      const rect = new Phaser.Geom.Rectangle(
        obj.x,
        obj.y - obj.height,
        obj.width,
        obj.height
      );

      if (rect.contains(player.x, player.y)) {
        this.played.add(obj.name);
        this.scene.startCutscene(obj.name);
      }
    });
  }

  async showDialogue(text) {
    return new Promise(resolve => {
      const dialog = this.scene.add
        .text(
          20,
          this.scene.scale.height - 80,
          text,
          {
            fontSize: "20px",
            color: "#fff",
            backgroundColor: "#0008",
            padding: { x: 10, y: 10 },
          }
        )
        .setScrollFactor(0);

      const key = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );

      key.once("down", () => {
        dialog.destroy();
        resolve();
      });
    });
  }
}
