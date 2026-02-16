export default class CutsceneManager {
  constructor(scene) {
    this.scene = scene;
    this.running = false;
    this.text = null;
  }
  async play(cutscene) {
    if (this.running) return;
    this.running = true;
    // Lock movement for entire cutscene
    this.scene.playerCanMove = false;
    for (const action of cutscene) {
      await this.runAction(action);
    }
    // Cleanup
    this.scene.playerCanMove = true;
    if (this.text) {
      this.text.destroy();
      this.text = null;
    }
    this.running = false;
  }
  runAction(action) {
    return new Promise((resolve) => {
      const cam = this.scene.cameras.main;
      switch (action.type) {
        case "lockPlayer":
          this.scene.playerCanMove = false;
          resolve();
          break;
        case "unlockPlayer":
          this.scene.playerCanMove = true;
          resolve();
          break;
        case "cameraMove":
          cam.stopFollow();
          cam.pan(action.x, action.y, action.duration, "Linear", true);
          cam.once("camerapancomplete", resolve);
          // Safety fallback (never freeze)
          this.scene.time.delayedCall(action.duration + 50, resolve);
          break;
        case "cameraFollowPlayer":
          cam.startFollow(this.scene.player, true, 0.1, 0.1);
          resolve();
          break;
        case "wait":
          this.scene.time.delayedCall(action.duration, resolve);
          break;
        case "dialogue":
          this.playDialogue(action.lines).then(resolve);
          break;
        case "fadeIn":
          this.playFadeIn(action.duration).then(resolve);
          break;
        default:
          resolve();
      }
    });
  }
  async playDialogue(lines) {
    for (const line of lines) {
      if (this.text) this.text.destroy();
      if (this.textBox) this.textBox.destroy();
      const { width, height } = this.scene.scale;
      // Background panel (semi-transparent, rounded)
      this.textBox = this.scene.add
        .rectangle(
          width / 2, // center horizontally
          height - 120, // cinematic bottom
          width * 0.8, // 80% screen width
          120, // panel height
          0x000000, // black
          0.7, // opacity
        )
        .setStrokeStyle(3, 0xffffff) // white border
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1000);
      // Text inside panel
      this.text = this.scene.add
        .text(width / 2, height - 120, line, {
          font: "24px Georgia", // more cinematic font
          fill: "#ffffff",
          align: "center",
          wordWrap: { width: width * 0.7 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1001);
      // Optional: small blinking arrow to hint auto-advance
      const arrow = this.scene.add
        .text(width / 2 + width * 0.35 - 20, height - 70, "▼", {
          font: "22px Arial",
          fill: "#ffffff",
        })
        .setScrollFactor(0)
        .setDepth(1002);
      this.scene.tweens.add({
        targets: arrow,
        y: height - 60,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
      // Wait for SPACE or auto-advance
      await new Promise((resolve) => {
        const onClick = (pointer) => {
          if (pointer.button !== 0) return;
          cleanup();
        };
        const cleanup = () => {
          this.scene.input.off("pointerdown", onClick);
          arrow.destroy();
          resolve();
        };
        this.scene.input.on("pointerdown", onClick);
        // auto advance fallback
        this.scene.time.delayedCall(3000, cleanup);
      });
    }
    // Cleanup last text
    if (this.text) this.text.destroy();
    if (this.textBox) this.textBox.destroy();
  }
  async playFadeIn(duration) {
    const { width, height } = this.scene.scale;
    // Create black overlay covering entire screen
    const blackOverlay = this.scene.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 1.0)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9999);
    // Fade from black to transparent
    this.scene.tweens.add({
      targets: blackOverlay,
      alpha: 0,
      duration: duration,
      ease: "Power2.easeOut",
      onComplete: () => {
        blackOverlay.destroy();
      },
    });
    // Wait for fade to complete
    return new Promise((resolve) => {
      this.scene.time.delayedCall(duration, resolve);
    });
  }
}
