export default class CinematicBars {
  constructor(scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    const { width, height } = this.camera;
    this.barHeight = Math.floor(height * 0.12); // 12% top & bottom
    this.topBar = scene.add
      .rectangle(0, -this.barHeight, width, this.barHeight, 0x000000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(10000);
    this.bottomBar = scene.add
      .rectangle(0, height, width, this.barHeight, 0x000000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(10000);
  }
  show(duration = 500) {
    const h = this.barHeight;
    this.scene.tweens.add({
      targets: this.topBar,
      y: 0,
      duration,
      ease: "Sine.easeOut",
    });
    this.scene.tweens.add({
      targets: this.bottomBar,
      y: this.camera.height - h,
      duration,
      ease: "Sine.easeOut",
    });
  }
  hide(duration = 500) {
    this.scene.tweens.add({
      targets: this.topBar,
      y: -this.barHeight,
      duration,
      ease: "Sine.easeIn",
    });
    this.scene.tweens.add({
      targets: this.bottomBar,
      y: this.camera.height,
      duration,
      ease: "Sine.easeIn",
    });
  }
  resize() {
    const { width, height } = this.camera;
    this.topBar.width = width;
    this.bottomBar.width = width;
    this.bottomBar.y = height;
  }
}
