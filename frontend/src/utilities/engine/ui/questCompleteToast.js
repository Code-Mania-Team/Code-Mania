// src/game/ui/QuestCompleteToast.js
export default class QuestCompleteToast {
  constructor(scene, { offsetY = 0, titleText = "EARNED EXP" } = {}) {
    this.scene = scene;

    const marginX = 16;
    const marginY = 16;
    this.isShowing = false;


    // Start off-screen (left)
    this.container = scene.add
      .container(-320, marginY + offsetY)
      .setDepth(10000)
      .setAlpha(0)
      .setScrollFactor(0);

    // Background
    this.bg = scene.add
      .rectangle(0, 0, 260, 58, 0x000000, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x00ff88);

    // Title
    this.titleText = scene.add.text(10, 6, titleText, {
      fontSize: "13px",
      fontStyle: "bold",
      color: "#00ff88"
    });

    // Subtitle (quest title)
    this.subtitle = scene.add.text(10, 24, "", {
      fontSize: "12px",
      color: "#ffffff",
      wordWrap: { width: 150 },
    });

    // ⭐ EXP text
    this.expText = scene.add
      .text(230, 30, "", {
        fontSize: "12px",
        fontStyle: "bold",
        color: "#ffd700",
        stroke: "#000000",
        strokeThickness: 2
      })
      .setOrigin(1, 0)
      .setVisible(false);

    /**
     * IMPORTANT FIX:
     * Never create image with null texture.
     * Use a guaranteed loaded texture (quest_icon is already preloaded).
     */
    this.badgeIcon = scene.add
      .image(235, 30, "quest_icon") // Safe placeholder texture
      .setDisplaySize(24, 24)
      .setOrigin(0.5)
      .setVisible(false);

    this.container.add([
      this.bg,
      this.titleText,
      this.subtitle,
      this.expText,
      this.badgeIcon
    ]);

    this.targetX = marginX;
  }

  /**
   * @param {Object} data
   * @param {string} data.title
   * @param {string|null} data.badgeKey
   * @param {number} data.exp
   * @param {Function} [data.onHidden]
   */
  show({ title = "", badgeKey = null, exp = 0, onHidden = null }) {
    if (!this.scene || !this.scene.sys || !this.container || !this.container.scene) return;
    if (this.isShowing) return;
    this.isShowing = true;

    this.subtitle.setText(String(title || "").trim());
    this.subtitle.setVisible(this.subtitle.text.length > 0);

    if (badgeKey && this.scene.textures.exists(badgeKey)) {
      const texture = this.scene.textures.get(badgeKey);
      const sourceImage = texture?.getSourceImage?.();
      if (sourceImage) {
        this.badgeIcon.setTexture(badgeKey);
        this.badgeIcon.setVisible(true);
      } else {
        this.badgeIcon.setVisible(false);
      }
    } else {
      this.badgeIcon.setVisible(false);
    }

    if (exp > 0) {
      this.expText
        .setText(`+${exp} XP`)
        .setVisible(true);

      this.expText.x = this.badgeIcon.visible ? 180 : 230;
    } else {
      this.expText.setVisible(false);
    }

    this.scene.tweens.killTweensOf(this.container);

    this.container.setX(-320).setAlpha(0);

    this.scene.tweens.add({
      targets: this.container,
      x: this.targetX,
      alpha: 1,
      duration: 300,
      ease: "Back.Out"
    });

    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: this.container,
        x: -320,
        alpha: 0,
        duration: 400,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.isShowing = false;
          onHidden?.();
        }
      });
    });
  }

}
