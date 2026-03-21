import Phaser from "phaser";

export default class LessonExampleSplash {
  constructor(scene, { depth = 20050, yRatio = 0.5 } = {}) {
    this.scene = scene;
    this.depth = depth;
    this.yRatio = yRatio;

    this.container = null;
    this.titleText = null;
    this.bodyText = null;
    this._gap = 10;

    this._active = false;
    this._handleResize = null;

    this._typeEvents = [];
    this._outEvent = null;
  }

  destroy() {
    if (this._handleResize) {
      this.scene.scale.off("resize", this._handleResize);
      this._handleResize = null;
    }

    this._typeEvents.forEach((e) => e?.remove?.());
    this._typeEvents = [];

    this._outEvent?.remove?.();
    this._outEvent = null;

    if (this.container) this.scene.tweens.killTweensOf(this.container);

    this.container?.destroy(true);
    this.container = null;
    this.titleText = null;
    this.bodyText = null;
    this._active = false;
  }

  _layoutTexts() {
    if (!this.titleText) return;
    const bodyText = this.bodyText;

    const totalH = this.titleText.height + (bodyText ? this._gap + bodyText.height : 0);
    this.titleText.y = bodyText
      ? -Math.floor(totalH / 2) + Math.floor(this.titleText.height / 2)
      : 0;

    if (bodyText) {
      bodyText.y =
        this.titleText.y +
        Math.floor(this.titleText.height / 2) +
        this._gap +
        Math.floor(bodyText.height / 2);
    }
  }

  _startTypewriter(textObj, fullText, speed, onComplete) {
    const text = String(fullText || "");
    const delay = Math.max(8, Number(speed) || 18);

    let i = 0;
    textObj.setText("");

    if (!text.length) {
      onComplete?.();
      return;
    }

    const ev = this.scene.time.addEvent({
      delay,
      loop: true,
      callback: () => {
        if (!this._active) {
          ev.remove(false);
          return;
        }

        i += 1;
        textObj.setText(text.slice(0, i));
        this._layoutTexts();

        if (i >= text.length) {
          ev.remove(false);
          onComplete?.();
        }
      },
    });

    this._typeEvents.push(ev);
  }

  show({ title = "", body = "", hold = 2400, typeSpeedTitle = 34, typeSpeedBody = 26 } = {}) {
    const safeTitle = String(title || "").trim();
    const safeBody = String(body || "").trim();
    if (!safeTitle && !safeBody) return;
    if (this._active) return;
    if (!this.scene?.add || !this.scene?.scale || !this.scene?.time || !this.scene?.tweens) return;

    this._active = true;

    const { width, height } = this.scene.scale;
    const wrapWidth = Math.min(Math.floor(width * 0.84), 760);
    const y = Math.floor(height * this.yRatio);

    const titleFontSize = Math.max(28, Math.min(44, Math.floor(width / 18)));
    const bodyFontSize = Math.max(16, Math.min(22, Math.floor(width / 34)));

    const container = this.scene.add
      .container(Math.floor(width / 2), y)
      .setScrollFactor(0)
      .setDepth(this.depth)
      .setAlpha(0)
      .setScale(0.92);

    const titleText = this.scene.add
      .text(0, 0, "", {
        font: `bold ${titleFontSize}px Georgia`,
        fill: "#ffffff",
        align: "center",
        wordWrap: { width: wrapWidth, useAdvancedWrap: true },
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    titleText.setShadow(0, 2, "#000000", 6, true, true);

    const hasBody = Boolean(safeTitle && safeBody);
    const bodyText = hasBody
      ? this.scene.add
        .text(0, 0, "", {
          font: `${bodyFontSize}px Georgia`,
          fill: "#e5e7eb",
          align: "center",
          wordWrap: { width: wrapWidth, useAdvancedWrap: true },
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
      : null;
    if (bodyText) bodyText.setShadow(0, 2, "#000000", 6, true, true);

    container.add([titleText]);
    if (bodyText) container.add(bodyText);

    this.container = container;
    this.titleText = titleText;
    this.bodyText = bodyText;

    this._handleResize = () => {
      if (!this.container || !this.titleText) return;
      const { width: w, height: h } = this.scene.scale;
      const nextWrap = Math.min(Math.floor(w * 0.84), 760);
      const nextTitleFontSize = Math.max(28, Math.min(44, Math.floor(w / 18)));
      const nextBodyFontSize = Math.max(16, Math.min(22, Math.floor(w / 34)));
      const nextY = Math.floor(h * this.yRatio);

      this.container.setPosition(Math.floor(w / 2), nextY);
      this.titleText.setFontSize(nextTitleFontSize);
      this.titleText.setWordWrapWidth(nextWrap, true);
      if (this.bodyText) {
        this.bodyText.setFontSize(nextBodyFontSize);
        this.bodyText.setWordWrapWidth(nextWrap, true);
      }

      this._layoutTexts();
    };

    this.scene.scale.on("resize", this._handleResize);

    const inTween = this.scene.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      y: y - 10,
      duration: 650,
      ease: "Back.Out",
    });

    // Typewriter: title first, then body; hold starts after typing completes.
    const titleToType = safeTitle || safeBody;
    const bodyToType = hasBody ? safeBody : "";

    this._startTypewriter(titleText, titleToType, typeSpeedTitle, () => {
      if (!this._active) return;
      if (!bodyText) {
        this._outEvent = this.scene.time.delayedCall(Math.max(0, Number(hold) || 0), () => {
          this.scene.tweens.add({
            targets: container,
            alpha: 0,
            y: y - 34,
            duration: 520,
            ease: "Sine.easeIn",
            onComplete: () => {
              inTween?.stop?.();
              this.destroy();
            },
          });
        });
        return;
      }

      this.scene.time.delayedCall(120, () => {
        if (!this._active) return;
        this._startTypewriter(bodyText, bodyToType, typeSpeedBody, () => {
          this._outEvent = this.scene.time.delayedCall(Math.max(0, Number(hold) || 0), () => {
            this.scene.tweens.add({
              targets: container,
              alpha: 0,
              y: y - 34,
              duration: 520,
              ease: "Sine.easeIn",
              onComplete: () => {
                inTween?.stop?.();
                this.destroy();
              },
            });
          });
        });
      });
    });
  }
}
