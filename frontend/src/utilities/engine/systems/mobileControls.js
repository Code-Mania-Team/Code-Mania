export default class MobileControls {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.onInteract = options.onInteract || (() => {});
    this.vector = { x: 0, y: 0 };

    this.createJoystick();
    this.createActionButton();
  }

  createJoystick() {
    const { width, height } = this.scene.scale;

    this.base = this.scene.add
      .circle(100, height - 100, 50, 0x000000, 0.4)
      .setScrollFactor(0)
      .setDepth(10000);

    this.thumb = this.scene.add
      .circle(100, height - 100, 25, 0xffffff, 0.6)
      .setScrollFactor(0)
      .setDepth(10001);

    this.scene.input.on("pointermove", (p) => {
      if (!p.isDown) return;

      const dx = p.x - this.base.x;
      const dy = p.y - this.base.y;
      const dist = Math.min(Math.hypot(dx, dy), 40);
      const angle = Math.atan2(dy, dx);

      this.thumb.setPosition(
        this.base.x + Math.cos(angle) * dist,
        this.base.y + Math.sin(angle) * dist,
      );

      this.vector.x = Math.cos(angle) * (dist / 40);
      this.vector.y = Math.sin(angle) * (dist / 40);
    });

    this.scene.input.on("pointerup", () => {
      this.thumb.setPosition(this.base.x, this.base.y);
      this.vector.x = 0;
      this.vector.y = 0;
    });
  }

  createActionButton() {
    const { width, height } = this.scene.scale;

    this.button = this.scene.add
      .circle(width - 80, height - 100, 40, 0x00aa00, 0.6)
      .setScrollFactor(0)
      .setDepth(10000)
      .setInteractive();

    this.button.on("pointerdown", () => {
      this.onInteract();
    });
  }

  // 🔥 THIS IS WHAT YOU WERE MISSING
  resize(width, height) {
    if (!this.base || !this.thumb || !this.button) return;

    // Move joystick (bottom-left)
    this.base.setPosition(100, height - 100);
    this.thumb.setPosition(100, height - 100);

    // Move action button (bottom-right)
    this.button.setPosition(width - 80, height - 100);
  }

  destroy() {
    this.base?.destroy();
    this.thumb?.destroy();
    this.button?.destroy();
  }
}
