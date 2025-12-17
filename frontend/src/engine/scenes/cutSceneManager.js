// CutsceneManager.js
import Phaser from "phaser";
import EasyStar from "easystarjs";

export default class CutsceneManager {
  constructor(scene) {
    this.scene = scene;
    this.easystar = new EasyStar.js();
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
        row.push(tile?.properties.collision ? 1 : 0); // 1 = blocked
      }
      grid.push(row);
    }

    this.easystar.setGrid(grid);
    this.easystar.setAcceptableTiles([0]); // walkable
    this.easystar.enableDiagonals();
  }

  async moveNPC(npc, targetX, targetY, speed = 100) {
    const map = this.scene.mapLoader.map;
    // const layer = this.scene.mapLoader.layers["Foreground"];
    const tileSize = map.tileWidth;

    // Convert world to tile coordinates and clamp inside the map
    const startX = Phaser.Math.Clamp(Math.floor(npc.x / tileSize), 0, map.width - 1);
    const startY = Phaser.Math.Clamp(Math.floor(npc.y / tileSize), 0, map.height - 1);
    const endX = Phaser.Math.Clamp(Math.floor(targetX / tileSize), 0, map.width - 1);
    const endY = Phaser.Math.Clamp(Math.floor(targetY / tileSize), 0, map.height - 1);

    return new Promise((resolve) => {
      this.easystar.findPath(startX, startY, endX, endY, (path) => {
        if (!path || path.length === 0) return resolve();

        let step = 0;

        const moveStep = () => {
          if (step >= path.length) return resolve();

          const next = path[step];
          const worldX = next.x * tileSize + tileSize / 2;
          const worldY = next.y * tileSize + tileSize / 2;

          // Face NPC toward next tile
          this.faceTowards(npc, worldX, worldY);

          this.scene.tweens.add({
            targets: npc,
            x: worldX,
            y: worldY,
            duration:
              (1000 / speed) *
              Phaser.Math.Distance.Between(npc.x, npc.y, worldX, worldY),
            onComplete: () => {
              step++;
              moveStep();
            },
          });
        };

        moveStep();
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

  async showDialogue(text) {
    return new Promise((resolve) => {
      const dialog = this.scene.add.text(
        this.scene.cameras.main.worldView.x + 20,
        this.scene.cameras.main.worldView.y + this.scene.scale.height - 80,
        text,
        {
          fontSize: "20px",
          color: "#fff",
          backgroundColor: "#0008",
          padding: { x: 10, y: 10 },
        }
      ).setScrollFactor(0);

      const key = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
      const finish = () => {
        dialog.destroy();
        key.off("down", finish);
        resolve();
      };
      key.on("down", finish);
    });
  }
}
