import Phaser from "phaser";
import GameScene from "./scenes/GameScene";
import HelpScene from "./scenes/HelpScene";

export function initPhaserGame(containerId) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: containerId,
    backgroundColor: "#0f172a",
    pixelArt: true,

    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },

    // 🔥 NO MARGINS, FULL FILL
    scale: {
      mode: Phaser.Scale.ENVELOP,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 960,
      height: 540,
    },

    scene: [GameScene, HelpScene],
  });

  // -------------------------------
  // ✅ CLEANUP (IMPORTANT FOR REACT)
  // -------------------------------
  game.cleanup = () => {
    try {
      console.log("🔥 Cleaning up Phaser...");

      // Stop all scenes safely
      Object.values(game.scene.keys).forEach(scene => {
        scene?.scene?.stop?.();
      });

      // Destroy game instance
      game.destroy(true);

    } catch (err) {
      console.warn("Phaser cleanup error:", err);
    }
  };

  return game;
}
