import Phaser from "phaser";
import GameScene from "./scenes/gameScene";
import HelpScene from "./scenes/helpScene";

<<<<<<< HEAD
export function initPhaserGame(containerId) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: containerId,
    backgroundColor: "#0f172a",
    pixelArt: true,
=======
let game = null;

export const startGame = ({ exerciseId, parent }) => {
  // destroy previous game
  if (game) {
    game.destroy(true);
    game = null;
  }

  const container = document.getElementById(parent);
  if (!container) {
    console.error("❌ Phaser container not found:", parent);
    return;
  }

  // const width = container.clientWidth;
  // const height = container.clientHeight;

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 600,
    backgroundColor: "#000000",
>>>>>>> 56e5cef87a8dc875a9c142da84ca25116549c24a

    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },

<<<<<<< HEAD
    // 🔥 NO MARGINS, FULL FILL
    scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: Phaser.Scale.DEFAULT_WIDTH || 960,
    height: Phaser.Scale.DEFAULT_HEIGHT || 540,
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
=======
    scale: {
      mode: Phaser.Scale.FIT,        // ✅ SAFE
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    scene: [],
  });


  // register scenes
  game.scene.add("GameScene", GameScene, false);
  game.scene.add("HelpScene", HelpScene, false);

  // start with correct exercise → map
  game.scene.start("GameScene", { exerciseId });

  // 🔁 keep reference
  window.game = game;
};
>>>>>>> 56e5cef87a8dc875a9c142da84ca25116549c24a
