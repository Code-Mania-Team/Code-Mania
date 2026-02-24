import Phaser from "phaser";
import GameScene from "./scenes/gameScene";
import HelpScene from "./scenes/helpScene";

let game = null;

export const startGame = ({ exerciseId, quest, parent, completedQuests = [] }) => {
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

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: "#0f172a",

    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },

    scene: [],
  });


  // register scenes
  game.scene.add("GameScene", GameScene, false);
  game.scene.add("HelpScene", HelpScene, false);

  // start with correct exercise → map
  game.scene.start("GameScene", { exerciseId, quest, completedQuests });

  // 🔁 keep reference
  window.game = game;
};
