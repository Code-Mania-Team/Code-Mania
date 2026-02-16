import Phaser from "phaser";
export default class QuestPointer {
  constructor(scene) {
    this.scene = scene;
    // Arrow fixed to camera
    this.arrow = scene.add
      .image(scene.cameras.main.width - 60, 60, "arrow_up")
      .setScrollFactor(0)
      .setDepth(1000)
      .setScale(1.5);
    this.target = null;
  }
  setTarget(gameObject) {
    this.target = gameObject;
    this.arrow.setVisible(!!gameObject);
  }
  update() {
    if (!this.target) return;
    const player = this.scene.player;
    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      this.target.x,
      this.target.y,
    );
    if (distance < 40) {
      this.arrow.setVisible(false);
    } else {
      this.arrow.setVisible(true);
    }
  }
}
