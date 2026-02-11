// src/game/ui/QuestCompleteToast.js
export default class QuestCompleteToast {
  constructor(scene) {
    this.scene = scene;

    const marginX = 16;
    const marginY = 16;

    // start off-screen (left)
    this.container = scene.add
      .container(-320, marginY)
      .setDepth(10000)
      .setAlpha(0)
      .setScrollFactor(0);

    // background
    this.bg = scene.add
      .rectangle(0, 0, 260, 48, 0x000000, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x00ff88);

    // title
    this.titleText = scene.add.text(10, 6, "QUEST COMPLETED", {
      fontSize: "13px",
      fontStyle: "bold",
      color: "#00ff88"
    });

    // subtitle (quest title)
    this.subtitle = scene.add.text(10, 24, "", {
      fontSize: "12px",
      color: "#ffffff",
      wordWrap: { width: 150 }
    });

    // ⭐ EXP text (right-aligned, optional)
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

    // 🏅 BADGE icon (far right)
    this.badgeIcon = scene.add
      .image(235, 24, null)
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
    this.subtitle.setText(title);

    // 🏅 Badge
    if (badgeKey && this.scene.textures.exists(badgeKey)) {
      this.badgeIcon
        .setTexture(badgeKey)
        .setVisible(true);
    } else {
      this.badgeIcon.setVisible(false);
    }

    // ⭐ EXP
    if (exp > 0) {
      this.expText
        .setText(`+${exp} XP`)
        .setVisible(true);

      // shift left if badge exists
      this.expText.x = this.badgeIcon.visible ? 180 : 230;
    } else {
      this.expText.setVisible(false);
    }

    // kill previous tweens
    this.scene.tweens.killTweensOf(this.container);

    // reset position
    this.container
      .setX(-320)
      .setAlpha(0);

    // slide in
    this.scene.tweens.add({
      targets: this.container,
      x: this.targetX,
      alpha: 1,
      duration: 300,
      ease: "Back.Out",
      onComplete: () => {
        // subtle EXP pop
        if (exp > 0) {
          this.expText.setScale(1.4);
          this.scene.tweens.add({
            targets: this.expText,
            scale: 1,
            duration: 250,
            ease: "Back.Out"
          });
        }
      }
    });

    // slide out
    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: this.container,
        x: -320,
        alpha: 0,
        duration: 400,
        ease: "Sine.easeIn"
      });
    });
  }
}
