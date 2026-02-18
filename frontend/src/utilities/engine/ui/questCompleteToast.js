// src/game/ui/QuestCompleteToast.js
export default class QuestCompleteToast {
  constructor(scene) {
    this.scene = scene;

    const marginX = 16;
    const marginY = 16;
    this.isShowing = false;


    // Start off-screen (left)
    this.container = scene.add
      .container(-320, marginY)
      .setDepth(10000)
      .setAlpha(0)
      .setScrollFactor(0);

    // Background
    this.bg = scene.add
      .rectangle(0, 0, 260, 48, 0x000000, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x00ff88);

    // Title
    this.titleText = scene.add.text(10, 6, "QUEST COMPLETED", {
      fontSize: "13px",
      fontStyle: "bold",
      color: "#00ff88"
    });

    // Subtitle (quest title)
    this.subtitle = scene.add.text(10, 24, "", {
      fontSize: "12px",
      color: "#ffffff",
      wordWrap: { width: 150 }
    });

    // ⭐ EXP text
    this.expText = scene.add
      .text(230, 24, "", {
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
      .image(235, 24, "quest_icon") // Safe placeholder texture
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
   */
  show({ title = "", badgeKey = null, exp = 0 }) {
    console.log("🎉 Showing QuestCompleteToast:", { title, badgeKey, exp });
    if (this.isShowing) return;
    this.isShowing = true;

    this.subtitle.setText(title);

    if (badgeKey && this.scene.textures.exists(badgeKey)) {
      this.badgeIcon.setTexture(badgeKey);
      this.badgeIcon.setVisible(true);
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
        }
      });
    });
  }

}
