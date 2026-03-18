import Phaser from "phaser";
import GameScene from "./scenes/gameScene";
import HelpScene from "./scenes/helpScene";

let game = null;
let mountedParentId = null;

const destroyGameInstance = () => {
  if (!game) return;
  game.destroy(true);
  game = null;
  mountedParentId = null;
  window.game = null;
};

const resizeGameToParent = (parentEl) => {
  if (!game || !parentEl) return;
  const width = parentEl.clientWidth || 800;
  const height = parentEl.clientHeight || 600;
  game.scale.resize(width, height);
};

export const stopGame = () => {
  destroyGameInstance();
};

export const startGame = ({ exerciseId, quest, parent, completedQuests = [] }) => {
  const container = document.getElementById(parent);
  if (!container) {
    console.error("❌ Phaser container not found:", parent);
    return;
  }

  const hasDetachedCanvas = Boolean(game && (!game.canvas || !game.canvas.isConnected));
  const wrongParent = Boolean(game && game.canvas && game.canvas.parentElement !== container);
  const shouldRecreate =
    Boolean(game && mountedParentId && mountedParentId !== parent) ||
    hasDetachedCanvas ||
    wrongParent;

  if (!game || shouldRecreate) {
    if (game && shouldRecreate) {
      destroyGameInstance();
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width,
      height,
      backgroundColor: "#0f172a",

      // Enable Phaser DOM Elements (used for rich quest text)
      dom: {
        createContainer: true,
      },

      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },

      scene: [],
    });

    game.scene.add("GameScene", GameScene, false);
    game.scene.add("HelpScene", HelpScene, false);
    mountedParentId = parent;
  }

  try {
    resizeGameToParent(container);
  } catch {
    destroyGameInstance();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width,
      height,
      backgroundColor: "#0f172a",
      dom: {
        createContainer: true,
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scene: [],
    });

    game.scene.add("GameScene", GameScene, false);
    game.scene.add("HelpScene", HelpScene, false);
    mountedParentId = parent;
  }

  if (game.scene.isActive("HelpScene")) {
    game.scene.stop("HelpScene");
  }

  if (game.scene.isActive("GameScene")) {
    game.scene.stop("GameScene");
  }

  game.scene.start("GameScene", { exerciseId, quest, completedQuests });

  // 🔁 keep reference
  window.game = game;
};
