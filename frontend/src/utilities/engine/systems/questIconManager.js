export default class QuestIconManager {
  constructor(scene) {
    this.scene = scene;
    this.icons = new Map();
    this.pool = [];
  }

  createIcon(npc, visible = true) {
    const pooled = this.pool.pop();
    const icon =
      pooled ||
      this.scene.add.sprite(
        npc.x,
        npc.y - (npc.displayHeight || 48) - 2,
        "quest_icon"
      );

    // NPC y is feet (origin 0.5, 1). Place icon just above the head.
    icon
      .setOrigin(0.5, 1)
      .setDisplaySize(48, 48)
      .setPosition(npc.x, npc.y - (npc.displayHeight || 48) + 6);
    icon.setActive(true);

    icon.setDepth(1000);
    icon.setVisible(visible);
    icon.play("quest-icon");

    icon.floatTween?.stop();
    icon.floatTween = this.scene.tweens.add({
      targets: icon,
      y: icon.y - 6,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.icons.set(npc, icon);
    return icon;
  }

  hideForNPC(npc) {
    const icon = this.icons.get(npc);
    if (!icon) return;
    icon.floatTween?.pause();
    icon.setVisible(false);
    icon.setActive(false);
    this.pool.push(icon);
    this.icons.delete(npc);
  }

  destroyAll() {
    this.icons.forEach((icon) => {
      icon.floatTween?.stop();
      icon.destroy();
    });
    this.pool.forEach((icon) => {
      icon.floatTween?.stop();
      icon.destroy();
    });
    this.icons.clear();
    this.pool = [];
  }
}
