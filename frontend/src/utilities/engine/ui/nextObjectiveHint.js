export default class NextObjectiveHint {
  constructor(scene, { offsetX = 16, offsetY = 16, width = 300 } = {}) {
    this.scene = scene;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.width = width;

    this.visible = false;

    this.container = scene.add
      .container(-360, offsetY)
      .setDepth(12000)
      .setScrollFactor(0)
      .setAlpha(0);

    this.bg = scene.add
      .rectangle(0, 0, width, 46, 0x000000, 0.72)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x60a5fa, 0.9);

    this.text = scene.add.text(12, 12, "", {
      font: "bold 14px Arial",
      fill: "#e5e7eb",
      wordWrap: { width: width - 24, useAdvancedWrap: true },
    });

    this.container.add([this.bg, this.text]);

    this.handleResize = () => {
      this.container.setY(this.offsetY);
      this.container.setX(this.visible ? this.offsetX : -360);
    };

    scene.scale.on("resize", this.handleResize);
    scene.events.once("shutdown", () => this.destroy());
  }

  destroy() {
    this.scene?.scale?.off?.("resize", this.handleResize);
    this.scene?.tweens?.killTweensOf?.(this.container);
    this.container?.destroy(true);
    this.container = null;
  }

  show(message) {
    if (!this.container) return;
    const text = String(message || "").trim();
    if (!text) return;

    this.text.setText(text);

    // Expand bg for wrapped text
    const nextHeight = Math.max(46, this.text.height + 24);
    this.bg.height = nextHeight;

    this.scene.tweens.killTweensOf(this.container);
    this.container.setAlpha(0);
    this.container.setX(-360);
    this.container.setY(this.offsetY);
    this.visible = true;

    this.scene.tweens.add({
      targets: this.container,
      x: this.offsetX,
      alpha: 1,
      duration: 320,
      ease: "Back.Out",
    });
  }

  hide() {
    if (!this.container || !this.visible) return;
    this.visible = false;

    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      x: -360,
      alpha: 0,
      duration: 240,
      ease: "Sine.easeIn",
    });
  }
}
