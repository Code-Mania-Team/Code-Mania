import Phaser from "phaser";
import GameScene from "./scenes/gameScene";
import HelpScene from "./scenes/helpScene";

let game = null;

export const startGame = ({
  exerciseId,
  quest,
  parent,
  completedQuests = [],
}) => {
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

    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },

    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
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
