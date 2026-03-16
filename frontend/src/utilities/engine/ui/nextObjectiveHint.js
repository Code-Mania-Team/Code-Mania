export default class NextObjectiveHint {
  constructor(scene, { offsetX = 16, offsetY = 16, width = 300 } = {}) {
    this.scene = scene;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.width = width;
    this.baseWidth = width;

    this.isMobile =
      scene?.sys?.game?.device?.os?.android ||
      scene?.sys?.game?.device?.os?.iOS;

    this._padX = 12;
    this._padY = 12;
    this._minHeight = 46;

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
      this._applyResponsiveLayout();
      this.container.setY(this.offsetY);
      this.container.setX(this.visible ? this.offsetX : -360);
    };

    scene.scale.on("resize", this.handleResize);
    scene.events.once("shutdown", () => this.destroy());

    this._applyResponsiveLayout();
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

    this._applyResponsiveLayout();
    this.text.setText(text);

    // Expand bg for wrapped text
    const nextHeight = Math.max(this._minHeight, this.text.height + this._padY * 2);
    this.bg.setSize(this.width, nextHeight);

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

  _applyResponsiveLayout() {
    if (!this.container) return;

    const viewportWidth = this.scene?.scale?.width || this.scene?.cameras?.main?.width || 0;
    const isSmallPhone = viewportWidth > 0 && viewportWidth <= 420;
    const isTinyPhone = viewportWidth > 0 && viewportWidth <= 360;

    // Keep space on the right so we don't collide with the HELP button on mobile.
    const reservedRight = this.isMobile ? (isTinyPhone ? 110 : 100) : 16;
    const maxWidth = viewportWidth > 0
      ? Math.max(180, viewportWidth - this.offsetX - reservedRight)
      : this.baseWidth;

    const targetWidth = this.isMobile
      ? Math.min(isTinyPhone ? 220 : 260, maxWidth)
      : Math.min(this.baseWidth, maxWidth);

    const fontSize = this.isMobile ? (isTinyPhone ? 11 : isSmallPhone ? 12 : 13) : 14;
    const padX = this.isMobile ? (isTinyPhone ? 10 : 11) : 12;
    const padY = this.isMobile ? 10 : 12;
    const minHeight = this.isMobile ? 40 : 46;

    this.width = targetWidth;
    this._padX = padX;
    this._padY = padY;
    this._minHeight = minHeight;

    this.bg.setSize(targetWidth, this.bg.height || minHeight);
    this.text.setPosition(padX, padY);
    this.text.setFontSize(fontSize);
    this.text.setWordWrapWidth(targetWidth - padX * 2, true);

    if (this.visible) {
      const nextHeight = Math.max(minHeight, this.text.height + padY * 2);
      this.bg.setSize(targetWidth, nextHeight);
    }
  }
}
