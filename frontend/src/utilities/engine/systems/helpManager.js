export default class HelpManager {
  constructor(scene) {
    this.scene = scene;
    this.STORAGE_KEY = "help_seen";
  }

  showOnceAfterIntro() {
    const seen = localStorage.getItem(this.STORAGE_KEY);
    if (seen) return;

    localStorage.setItem(this.STORAGE_KEY, "true");
    this.openHelp();
  }

  openHelp() {
    if (this.scene.scene.isActive("HelpScene")) return;

    this.scene.scene.pause();
    this.scene.scene.launch("HelpScene");
  }
}
