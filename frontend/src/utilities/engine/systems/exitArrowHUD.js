export default class ExitArrowManager {
  constructor(scene) {
    this.scene = scene;
  }

  createArrow(x, y, direction, visible = false) {
    const fallbackTexture = "arrow_up";
    const directionalTexture = `arrow_${direction}`;
    const textureKey = this.scene.textures.exists(directionalTexture)
      ? directionalTexture
      : (this.scene.textures.exists(fallbackTexture) ? fallbackTexture : null);

    if (!textureKey) {
      return null;
    }

    const arrow = this.scene.add.sprite(x, y - 8, textureKey);
    arrow.setDepth(99);
    arrow.setVisible(visible);

    const animKey = `arrow-${direction}`;
    if (this.scene.anims.exists(animKey) && textureKey === directionalTexture) {
      arrow.play(animKey);
    } else if (this.scene.anims.exists("arrow-up") && textureKey === fallbackTexture) {
      arrow.play("arrow-up");
      const rotationByDirection = {
        up: 0,
        right: Math.PI / 2,
        down: Math.PI,
        left: -Math.PI / 2,
      };
      arrow.setRotation(rotationByDirection[direction] ?? 0);
    }

    this.scene.tweens.add({
      targets: arrow,
      y: arrow.y - 10,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    return arrow;
  }
}
