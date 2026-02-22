// src/game/ui/BadgeUnlockPopup.js
export default class BadgeUnlockPopup {
  constructor(scene) {
    this.scene = scene;

    const { centerX, centerY } = scene.cameras.main;

    this.container = scene.add
      .container(centerX, centerY)
      .setDepth(20000)
      .setScrollFactor(0)
      .setAlpha(0)
      .setScale(0.6);

    const bg = scene.add
      .rectangle(0, 0, 220, 220, 0x000000, 0.9)
      .setStrokeStyle(3, 0x00ff88);

    this.badge = scene.add.image(0, -20, "badge-default").setScale(1);

    this.title = scene.add
      .text(0, 70, "BADGE UNLOCKED!", {
        fontSize: "18px",
        fontStyle: "bold",
        color: "#00ff88",
      })
      .setOrigin(0.5);

    this.subtitle = scene.add
      .text(0, 100, "", {
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.container.add([bg, this.badge, this.title, this.subtitle]);
  }

  show({ badgeKey, label }) {
    if (!badgeKey || !this.scene.textures.exists(badgeKey)) return;

    this.badge.setTexture(badgeKey);
    this.subtitle.setText(label || "Achievement Unlocked");

    this.scene.tweens.killTweensOf(this.container);

    this.container.setAlpha(0).setScale(0.6);

    // ✨ POP IN
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scale: 1,
      duration: 350,
      ease: "Back.Out",
    });

    // ✨ Badge bounce
    this.scene.tweens.add({
      targets: this.badge,
      scale: 1.2,
      duration: 250,
      yoyo: true,
      ease: "Back.Out",
    });

    // ⏱ Auto close
    this.scene.time.delayedCall(2200, () => {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        scale: 0.6,
        duration: 300,
        ease: "Sine.easeIn",
      });
    });
  }
}
