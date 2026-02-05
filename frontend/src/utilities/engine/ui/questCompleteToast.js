// src/game/ui/QuestCompleteToast.js
export default class QuestCompleteToast {
  constructor(scene) {
    this.scene = scene;

    const marginX = 16;
    const marginY = 16;

    // start off-screen (left)
    this.container = scene.add.container(-320, marginY)
      .setDepth(10000)
      .setAlpha(0)
      .setScrollFactor(0);

    // background
    const bg = scene.add.rectangle(0, 0, 260, 48, 0x000000, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x00ff88);

    // title
    const title = scene.add.text(10, 6, "QUEST COMPLETED", {
      fontSize: "13px",
      fontStyle: "bold",
      color: "#00ff88"
    });

    // subtitle
    this.subtitle = scene.add.text(10, 24, "", {
      fontSize: "12px",
      color: "#ffffff",
      wordWrap: { width: 170 }
    });

    // 🏅 BADGE (RIGHT SIDE, SMALL)
    this.badgeIcon = scene.add.image(235, 24, null)
      .setDisplaySize(24, 24)
      .setOrigin(0.5)
      .setVisible(false);

    this.container.add([bg, title, this.subtitle, this.badgeIcon]);

    this.targetX = marginX;
  }

  /**
   * @param {Object} data
   * @param {string} data.title
   * @param {string} data.badgeKey
   */
  show({ title = "", badgeKey = null }) {
    this.subtitle.setText(title);

    if (badgeKey && this.scene.textures.exists(badgeKey)) {
      this.badgeIcon
        .setTexture(badgeKey)
        .setVisible(true);
    } else {
      this.badgeIcon.setVisible(false);
    }

    this.scene.tweens.killTweensOf(this.container);

    // reset
    this.container
      .setX(-320)
      .setAlpha(0);

    // slide in
    this.scene.tweens.add({
      targets: this.container,
      x: this.targetX,
      alpha: 1,
      duration: 300,
      ease: "Back.Out"
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
