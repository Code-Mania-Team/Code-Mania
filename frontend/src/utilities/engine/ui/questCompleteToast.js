// src/game/ui/QuestCompleteToast.js
export default class QuestCompleteToast {
  constructor(scene) {
    this.scene = scene;

    this.container = scene.add.container(
      scene.cameras.main.centerX,
      scene.cameras.main.centerY - 80
    )
      .setDepth(10000)
      .setAlpha(0)
      .setScrollFactor(0);

    const bg = scene.add.rectangle(0, 0, 260, 70, 0x000000, 0.85)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x00ff88);

    const title = scene.add.text(0, -14, "QUEST COMPLETED!", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#00ff88"
    }).setOrigin(0.5);

    this.subtitle = scene.add.text(0, 14, "", {
      fontSize: "14px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.container.add([bg, title, this.subtitle]);
  }

  show(questTitle = "") {
    this.subtitle.setText(questTitle);

    this.scene.tweens.killTweensOf(this.container);

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      y: this.container.y - 20,
      duration: 300,
      ease: "Back.Out"
    });

    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        y: this.container.y + 20,
        duration: 400,
        ease: "Sine.easeIn"
      });
    });
  }
}
