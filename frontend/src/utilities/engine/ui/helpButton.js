export default class HelpButton {
  constructor(scene, onClick) {
    this.scene = scene;

    this.button = scene.add
      .text(scene.cameras.main.width - 16, 16, "❓ HELP", {
        fontSize: "16px",
        fontStyle: "bold",
        backgroundColor: "#000000",
        color: "#ffffff",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(2000)
      .setInteractive({ useHandCursor: true });

    this.button.on("pointerdown", onClick);
  }

  destroy() {
    this.button.destroy();
  }
}
