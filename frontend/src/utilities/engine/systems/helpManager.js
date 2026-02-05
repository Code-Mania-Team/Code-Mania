export default class HelpManager {
  constructor(scene) {
    this.scene = scene;
    this.hasShown = false; // 👈 session-only guard
    this.isOpening = false;
  }

  showOnceAfterIntro() {
    if (this.hasShown) return;

    this.hasShown = true; // mark immediately
    this.openHelp();
  }

  openHelp() {
    if (this.isOpening) return;

    const helpScene = this.scene.scene.get("HelpScene");
    if (helpScene && helpScene.scene.isActive()) return;

    this.isOpening = true;

    if (!this.scene.scene.isPaused()) {
      this.scene.scene.pause();
    }

    this.scene.scene.launch("HelpScene");

    // unlock when HelpScene closes
    this.scene.scene.get("HelpScene")?.events.once("shutdown", () => {
      this.isOpening = false;
    });
  }
}
