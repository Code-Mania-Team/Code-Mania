export default class ChestQuestIconManager {
  constructor(scene) {
    this.scene = scene;
    this.icons = new Map(); // questId → icon sprite
  }

  createIcon(x, y, questId) {
    const icon = this.scene.add.sprite(x, y - 32, "exclamation");
    icon.setDepth(1000);
    icon.play("exclamation"); // reuse animation if you want

    this.icons.set(questId, icon);
    return icon;
  }

  hideIconForQuest(questId) {
    const icon = this.icons.get(questId);
    if (icon) {
      icon.destroy();
      this.icons.delete(questId);
    }
  }

  clearAll() {
    this.icons.forEach(icon => icon.destroy());
    this.icons.clear();
  }
}
