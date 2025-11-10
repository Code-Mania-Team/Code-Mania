import Phaser from "phaser";
import GameScene from "./gameScene.js";

export function initPhaserGame(containerId) {
  const container = document.getElementById(containerId);
  const config = {
    type: Phaser.AUTO,
    parent: containerId,
    backgroundColor: "#1d1f27",
    pixelArt: true, 
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE, 
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: container.clientWidth,
      height: container.clientHeight,
    },
    render: {
      antialias: false,
    },
    scene: [GameScene],
  };

  const game = new Phaser.Game(config);

  const resizeObserver = new ResizeObserver(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    game.scale.resize(width, height);
    if (game.scene.keys["GameScene"]?.updateScale) {
      game.scene.keys["GameScene"].updateScale(width, height);
    }
  });

  resizeObserver.observe(container);

  game.cleanup = () => {
    resizeObserver.disconnect();
    game.destroy(true);
  };

  return game;
}
