import Phaser from "phaser";
import GameScene from "./scenes/gameScene.js";

export function initPhaserGame(containerId) {
  const container = document.getElementById(containerId);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: containerId,
    backgroundColor: "#1d1f27",
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 0 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: container.clientWidth,
      height: container.clientHeight,
    },
    scene: [GameScene],
  });

  // -------------------------------
  // ⭐ ADD THIS CLEANUP METHOD ⭐
  // -------------------------------
  game.cleanup = () => {
    try {
      console.log("🔥 Cleaning up Phaser...");

      // Stop scenes
      Object.values(game.scene.keys).forEach(scene => {
        scene?.scene?.stop?.();
      });

      // Destroy phaser instance
      game.destroy(true);

    } catch (err) {
      console.warn("Cleanup error:", err);
    }
  };
  // -------------------------------

  const resizeObserver = new ResizeObserver(() => {
    game.scale.resize(container.clientWidth, container.clientHeight);
    game.scene.keys["GameScene"]?.updateScale(
      container.clientWidth,
      container.clientHeight
    );
  });

  resizeObserver.observe(container);

  return game;
}
