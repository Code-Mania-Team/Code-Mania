export default class ExitArrowManager {
  constructor(scene) {
    this.scene = scene;
  }

  createArrow(x, y, direction, visible = false) {
    const arrow = this.scene.add.sprite(x, y - 8, `arrow_${direction}`);
    arrow.setDepth(99);
    arrow.setVisible(visible);
    arrow.play(`arrow-${direction}`);

    this.scene.tweens.add({
      targets: arrow,
      y: arrow.y - 10,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    return arrow;
  }
}
