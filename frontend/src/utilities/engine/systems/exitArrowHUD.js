import Phaser from "phaser";

export default class ExitArrowManager {
  constructor(scene) {
    this.scene = scene;
    this.arrows = [];
  }

  createArrow(x, y, direction, visible = false) {
    // 🔻 TRIANGLE POINTS DOWN BY DEFAULT
    const arrow = this.scene.add.triangle(
      0, 0,
      0, 0,
      16, 32,
      32, 0,
      0xffd200
    );

    const rotationMap = {
      down: 0,
      up: Phaser.Math.DegToRad(180),
      left: Phaser.Math.DegToRad(90),
      right: Phaser.Math.DegToRad(-90)
    };

    arrow.setRotation(rotationMap[direction] ?? 0);

    const container = this.scene.add.container(x, y - 8, [arrow]);
    container.setDepth(999);
    container.setVisible(visible);

    // RPG Maker-style floating animation
    this.scene.tweens.add({
      targets: container,
      y: "-=10",
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.arrows.push(container);
    return container;
  }

  showAll() {
    this.arrows.forEach(a => a.setVisible(true));
  }

  hideAll() {
    this.arrows.forEach(a => a.setVisible(false));
  }

  destroy() {
    this.arrows.forEach(a => a.destroy());
    this.arrows.length = 0;
  }
}