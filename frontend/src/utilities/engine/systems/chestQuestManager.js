export default class ChestQuestIconManager {
  constructor(scene) {
    this.scene = scene;
    this.icons = new Map(); // questId → icon sprite
    this.pool = [];
  }

  createIcon(x, y, questId) {
    const pooled = this.pool.pop();
    const icon = pooled || this.scene.add.sprite(x, y, "exclamation");

    // y is typically the top of the chest tile.
    icon
      .setOrigin(0.5, 1)
      .setDisplaySize(48, 48)
      .setPosition(x, y + 6);
    icon.setActive(true);
    icon.setVisible(true);
    icon.setDepth(1000);
    icon.play("exclamation"); // reuse animation if you want

    this.icons.set(questId, icon);
    return icon;
  }

  hideIconForQuest(questId) {
    const icon = this.icons.get(questId);
    if (icon) {
      icon.stop();
      icon.setVisible(false);
      icon.setActive(false);
      this.pool.push(icon);
      this.icons.delete(questId);
    }
  }

  clearAll() {
    this.icons.forEach((icon) => {
      icon.stop();
      icon.setVisible(false);
      icon.setActive(false);
      this.pool.push(icon);
    });
    this.icons.clear();
  }
}
