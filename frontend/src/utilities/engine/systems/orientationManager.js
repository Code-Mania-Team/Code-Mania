export default class OrientationManager {
  constructor(scene) {
    this.scene = scene;

    this.isMobile =
      scene.sys.game.device.os.android ||
      scene.sys.game.device.os.iOS;

    if (!this.isMobile) return;

    this.createOverlay();
    this.check();

    // Browser resize (orientation change)
    window.addEventListener("resize", () => this.check());
  }

  isLandscape() {
    return window.innerWidth > window.innerHeight;
  }

  check() {
    if (this.isLandscape()) {
      this.hide();
    } else {
      this.show();
    }
  }

  resize(width, height) {
    // 🔥 THIS IS WHAT YOU WERE MISSING
    if (!this.bg || !this.text) return;

    this.bg.setSize(width, height);
    this.bg.setPosition(width / 2, height / 2);

    this.text.setPosition(width / 2, height / 2);

    this.check();
  }

  createOverlay() {
    const { width, height } = this.scene.scale;

    this.bg = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.85
    )
      .setScrollFactor(0)
      .setDepth(20000)
      .setVisible(false);

    this.text = this.scene.add.text(
      width / 2,
      height / 2,
      "🔄 Rotate your device\nLandscape required",
      {
        font: "22px Arial",
        fill: "#ffffff",
        align: "center"
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20001)
      .setVisible(false);
  }

  show() {
    if (this.bg.visible) return; // prevent double pause

    this.bg.setVisible(true);
    this.text.setVisible(true);
    this.scene.scene.pause();
  }

  hide() {
    if (!this.bg.visible) return; // prevent double resume

    this.bg.setVisible(false);
    this.text.setVisible(false);
    this.scene.scene.resume();
  }

  destroy() {
    this.bg?.destroy();
    this.text?.destroy();
  }
}
