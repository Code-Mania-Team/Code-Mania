export default class HelpManager {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
  }

  openHelp() {
    if (this.isOpen) return;
    if (this.scene.scene.isActive("HelpScene")) return;

    this.isOpen = true;

    this.scene.scene.pause();
    this.scene.scene.launch("HelpScene");

    const helpScene = this.scene.scene.get("HelpScene");
    helpScene.events.once("shutdown", () => {
      this.isOpen = false;
    });
  }

  forceCloseHelp() {
    if (!this.scene.scene.isActive("HelpScene")) return;

    this.scene.scene.stop("HelpScene");
    this.scene.scene.resume("GameScene");
    this.isOpen = false;
  }
}
