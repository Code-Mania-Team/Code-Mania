export default class CutsceneManager {
  constructor(scene) {
    this.scene = scene;
    this.running = false;
    this.text = null;
    this.stopRequested = false;
    this._activeActionCleanup = null;
  }

  requestSkip() {
    this.stopRequested = true;
    if (typeof this._activeActionCleanup === "function") {
      this._activeActionCleanup();
    }
  }

  _setActionCleanup(cleanup) {
    this._activeActionCleanup = cleanup;
  }

  _clearActionCleanup() {
    this._activeActionCleanup = null;
  }

  async play(cutscene) {
    if (this.running) return;
    this.running = true;
    this.stopRequested = false;

    // Lock movement for entire cutscene
    this.scene.playerCanMove = false;

    for (const action of cutscene) {
      if (this.stopRequested) break;
      await this.runAction(action);
    }

    // Cleanup
    this.scene.playerCanMove = true;
    this.scene.cameras?.main?.startFollow?.(this.scene.player, true, 1, 1);
    this.scene.cameras?.main?.centerOn?.(this.scene.player.x, this.scene.player.y);

    if (this.text) {
      this.text.destroy();
      this.text = null;
    }
    if (this.textBox) {
      this.textBox.destroy();
      this.textBox = null;
    }

    this.running = false;
    this.stopRequested = false;
    this._clearActionCleanup();
  }

  runAction(action) {
    return new Promise(resolve => {
      const cam = this.scene.cameras.main;
      if (this.stopRequested) {
        resolve();
        return;
      }

      const resolveOnce = (() => {
        let done = false;
        return () => {
          if (done) return;
          done = true;
          this._clearActionCleanup();
          resolve();
        };
      })();

      switch (action.type) {
        case "lockPlayer":
          this.scene.playerCanMove = false;
          resolveOnce();
          break;

        case "unlockPlayer":
          this.scene.playerCanMove = true;
          resolveOnce();
          break;

        case "cameraMove":
          cam.stopFollow();
          cam.pan(action.x, action.y, action.duration, "Linear", true);

          const onPanComplete = () => resolveOnce();
          cam.once("camerapancomplete", onPanComplete);
          const fallback = this.scene.time.delayedCall(action.duration + 50, () => resolveOnce());

          this._setActionCleanup(() => {
            cam.off("camerapancomplete", onPanComplete);
            if (fallback?.remove) fallback.remove(false);
            resolveOnce();
          });
          break;

        case "cameraFollowPlayer":
          cam.startFollow(this.scene.player, true, 1, 1);
          cam.centerOn(this.scene.player.x, this.scene.player.y);
          resolveOnce();
          break;

        case "wait":
          const waitTimer = this.scene.time.delayedCall(action.duration, () => resolveOnce());
          this._setActionCleanup(() => {
            if (waitTimer?.remove) waitTimer.remove(false);
            resolveOnce();
          });
          break;

        case "dialogue":
          this.playDialogue(action.lines).then(() => resolveOnce());
          break;

        case "fadeIn":
          this.playFadeIn(action.duration).then(() => resolveOnce());
          break;

        default:
          resolveOnce();
      }
    });
  }

  async playDialogue(lines) {
    for (const line of lines) {
      if (this.stopRequested) break;

      if (this.text) this.text.destroy();
      if (this.textBox) this.textBox.destroy();

      const { width, height } = this.scene.scale;

      // Background panel (semi-transparent, rounded)
      this.textBox = this.scene.add.rectangle(
        width / 2,                // center horizontally
        height - 120,             // cinematic bottom
        width * 0.8,              // 80% screen width
        120,                      // panel height
        0x000000,                 // black
        0.7                       // opacity
      )
      .setStrokeStyle(3, 0xffffff) // white border
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);

      // Text inside panel
      this.text = this.scene.add.text(
        width / 2,
        height - 120,
        line,
        {
          font: "24px Georgia",    // more cinematic font
          fill: "#ffffff",
          align: "center",
          wordWrap: { width: width * 0.7 },
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001);

      // Optional: small blinking arrow to hint auto-advance
      const arrow = this.scene.add.text(
        width / 2 + width * 0.35 - 20,
        height - 70,
        "▼",
        { font: "22px Arial", fill: "#ffffff" }
      ).setScrollFactor(0)
      .setDepth(1002);

      // Wait for SPACE or auto-advance
      await new Promise(resolve => {
        let fallbackTimer;
        let bounceTween;

        const cleanup = () => {
          this.scene.input.off("pointerdown", onClick);
          if (fallbackTimer?.remove) fallbackTimer.remove(false);
          if (bounceTween?.stop) bounceTween.stop();
          arrow.destroy();
          this._clearActionCleanup();
          resolve();
        };

        const onClick = (pointer) => {
          if (pointer.button !== 0) return;
          cleanup();
        };

        fallbackTimer = this.scene.time.delayedCall(3000, cleanup);
        bounceTween = this.scene.tweens.add({
          targets: arrow,
          y: height - 60,
          duration: 600,
          yoyo: true,
          repeat: -1
        });

        this._setActionCleanup(cleanup);
        this.scene.input.on("pointerdown", onClick);
      });

      if (this.stopRequested) break;

    }

    // Cleanup last text
    if (this.text) this.text.destroy();
    if (this.textBox) this.textBox.destroy();
  }

  async playFadeIn(duration) {
    const { width, height } = this.scene.scale;
    
    // Create black overlay covering entire screen
    const blackOverlay = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      1.0
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(9999);

    // Fade from black to transparent
    this.scene.tweens.add({
      targets: blackOverlay,
      alpha: 0,
      duration: duration,
      ease: 'Power2.easeOut',
      onComplete: () => {
        blackOverlay.destroy();
      }
    });

    // Wait for fade to complete
    return new Promise(resolve => {
      this.scene.time.delayedCall(duration, resolve);
    });
  }

}
