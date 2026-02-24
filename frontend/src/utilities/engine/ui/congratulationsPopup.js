// src/game/ui/CongratulationsPopup.js
export default class CongratulationsPopup {
  constructor(scene) {
    this.scene = scene;

    const { centerX, centerY } = scene.cameras.main;

    this.container = scene.add.container(centerX, centerY)
      .setDepth(25000)
      .setScrollFactor(0)
      .setAlpha(0)
      .setScale(0.6);

    const bg = scene.add.rectangle(0, 0, 320, 180, 0x000000, 0.9)
      .setStrokeStyle(3, 0xffd700);

    this.title = scene.add.text(0, -40, "🎉 QUEST COMPLETE! 🎉", {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffd700"
    }).setOrigin(0.5);

    this.questTitle = scene.add.text(0, 10, "", {
      fontSize: "16px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.subtitle = scene.add.text(0, 45, "Great job, coder!", {
      fontSize: "14px",
      color: "#aaaaaa"
    }).setOrigin(0.5);

    this.container.add([
      bg,
      this.title,
      this.questTitle,
      this.subtitle
    ]);
  }

  show({ questTitle }) {
    this.questTitle.setText(questTitle || "Quest Completed");

    this.scene.tweens.killTweensOf(this.container);

    this.container
      .setAlpha(0)
      .setScale(0.6);

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: "Back.Out"
    });

    this.scene.time.delayedCall(2500, () => {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        scale: 0.6,
        duration: 300,
        ease: "Sine.easeIn"
      });
    });
  }
}
