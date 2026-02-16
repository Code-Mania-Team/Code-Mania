export default class QuestIconManager {
  constructor(scene) {
    this.scene = scene;
    this.icons = new Map();
  }

  createIcon(npc, visible = true) {
    const icon = this.scene.add.sprite(
      npc.x,
      npc.y - (npc.displayHeight || 32),
      "quest_icon"
    );

    icon.setDepth(100);
    icon.setVisible(visible);
    icon.play("quest-icon");

    this.scene.tweens.add({
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
    icon?.setVisible(false);
  }

  destroyAll() {
    this.icons.forEach(icon => icon.destroy());
    this.icons.clear();
  }
}
