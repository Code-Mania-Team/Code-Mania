import Phaser from "phaser";

export default class MobileControls {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.onInteract = options.onInteract || (() => {});
    this.onToggleQuest = options.onToggleQuest || (() => {});
    this.showQuestButton = Boolean(options.showQuestButton);
    this.vector = { x: 0, y: 0 };
    this.enabled = true;
    this.joystickPointerId = null;
    this.deadZone = 0.18;
    this.joystickRadius = 46;
    this.joystickMaxDistance = 40;
    this.interactRadius = 38;
    this.questRadius = 30;

    this.createJoystick();
    this.createActionButton();
    if (this.showQuestButton) {
      this.createQuestButton();
    }
    const { width, height } = this.scene.scale;
    this.resize(width, height);
  }

  createJoystick() {
    const { height } = this.scene.scale;

    this.base = this.scene.add.circle(100, height - 100, this.joystickRadius, 0x0b1220, 0.48)
      .setStrokeStyle(2, 0x93c5fd, 0.35)
      .setScrollFactor(0)
      .setDepth(10000);

    this.thumb = this.scene.add.circle(100, height - 100, 22, 0xe2e8f0, 0.68)
      .setStrokeStyle(2, 0xffffff, 0.42)
      .setScrollFactor(0)
      .setDepth(10001);

    this.baseHint = this.scene.add.text(100, height - 33, "MOVE", {
      fontSize: "10px",
      color: "#cbd5e1",
      fontStyle: "bold"
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001);

    this._onPointerDown = (p) => {
      if (!this.enabled) return;

      const dx = p.x - this.base.x;
      const dy = p.y - this.base.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= 70) {
        this.joystickPointerId = p.id;
      }
    };

    this._onPointerMove = (p) => {
      if (!this.enabled) return;
      if (!p.isDown) return;
      if (p.id !== this.joystickPointerId) return;

      const dx = p.x - this.base.x;
      const dy = p.y - this.base.y;
      const dist = Math.min(Math.hypot(dx, dy), this.joystickMaxDistance);
      const angle = Math.atan2(dy, dx);

      this.thumb.setPosition(
        this.base.x + Math.cos(angle) * dist,
        this.base.y + Math.sin(angle) * dist
      );

      const normalized = dist / this.joystickMaxDistance;
      if (normalized < this.deadZone) {
        this.vector.x = 0;
        this.vector.y = 0;
        return;
      }

      this.vector.x = Math.cos(angle) * normalized;
      this.vector.y = Math.sin(angle) * normalized;
    };

    this._onPointerUp = (p) => {
      if (p.id !== this.joystickPointerId) return;

      this.joystickPointerId = null;
      this.thumb.setPosition(this.base.x, this.base.y);
      this.vector.x = 0;
      this.vector.y = 0;
    };

    this.scene.input.on("pointerdown", this._onPointerDown);
    this.scene.input.on("pointermove", this._onPointerMove);
    this.scene.input.on("pointerup", this._onPointerUp);
  }

  createActionButton() {
    const { width, height } = this.scene.scale;

    this.interactButton = this.scene.add.circle(
      width - 80,
      height - 100,
      this.interactRadius,
      0x16a34a,
      0.72
    )
      .setStrokeStyle(2, 0xffffff, 0.4)
      .setScrollFactor(0)
      .setDepth(10000)
      .setInteractive(new Phaser.Geom.Circle(0, 0, 48), Phaser.Geom.Circle.Contains);

    this.interactLabel = this.scene.add.text(width - 80, height - 100, "E", {
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "bold"
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001);

    this.interactHint = this.scene.add.text(width - 80, height - 45, "INTERACT", {
      fontSize: "10px",
      color: "#dbeafe",
      fontStyle: "bold"
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001);

    this.interactButton.on("pointerdown", () => {
      if (!this.enabled) return;
      this.interactButton.setScale(0.94);
      this.onInteract();
    });

    this.interactButton.on("pointerup", () => {
      this.interactButton.setScale(1);
    });

    this.interactButton.on("pointerout", () => {
      this.interactButton.setScale(1);
    });
  }

  createQuestButton() {
    const { width, height } = this.scene.scale;

    this.questButton = this.scene.add.circle(
      width - 170,
      height - 140,
      this.questRadius,
      0x2563eb,
      0.72
    )
      .setStrokeStyle(2, 0xffffff, 0.4)
      .setScrollFactor(0)
      .setDepth(10000)
      .setInteractive(new Phaser.Geom.Circle(0, 0, 40), Phaser.Geom.Circle.Contains);

    this.questLabel = this.scene.add.text(width - 170, height - 140, "Q", {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold"
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001);

    this.questHint = this.scene.add.text(width - 170, height - 95, "QUEST", {
      fontSize: "10px",
      color: "#dbeafe",
      fontStyle: "bold"
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001);

    this.questButton.on("pointerdown", () => {
      if (!this.enabled) return;
      this.questButton.setScale(0.94);
      this.onToggleQuest();
    });

    this.questButton.on("pointerup", () => {
      this.questButton.setScale(1);
    });

    this.questButton.on("pointerout", () => {
      this.questButton.setScale(1);
    });
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);

    if (!this.enabled) {
      this.vector.x = 0;
      this.vector.y = 0;
      this.joystickPointerId = null;
      this.thumb?.setPosition(this.base.x, this.base.y);
    }

    const visible = this.enabled;
    this.base?.setVisible(visible);
    this.thumb?.setVisible(visible);
    this.interactButton?.setVisible(visible);
    this.interactLabel?.setVisible(visible);
    this.interactHint?.setVisible(visible);
    this.questButton?.setVisible(visible);
    this.questLabel?.setVisible(visible);
    this.questHint?.setVisible(visible);
    this.baseHint?.setVisible(visible);

    if (this.interactButton?.input) this.interactButton.input.enabled = this.enabled;
    if (this.questButton?.input) this.questButton.input.enabled = this.enabled;
  }

  // 🔥 THIS IS WHAT YOU WERE MISSING
  resize(width, height) {
    if (!this.base || !this.thumb || !this.interactButton) return;

    const sidePadding = Math.max(22, Math.round(width * 0.055));
    const bottomPadding = Math.max(90, Math.round(height * 0.14));

    const joystickX = sidePadding + this.joystickRadius;
    const joystickY = height - bottomPadding;

    const interactX = width - sidePadding - this.interactRadius;
    const interactY = height - bottomPadding;

    const questX = interactX - 84;
    const questY = interactY - 46;

    // Move joystick (bottom-left)
    this.base.setPosition(joystickX, joystickY);
    this.thumb.setPosition(joystickX, joystickY);
    this.baseHint?.setPosition(joystickX, joystickY + this.joystickRadius + 12);

    // Move action button (bottom-right)
    this.interactButton.setPosition(interactX, interactY);
    this.interactLabel?.setPosition(interactX, interactY);
    this.interactHint?.setPosition(interactX, interactY + this.interactRadius + 12);

    this.questButton?.setPosition(questX, questY);
    this.questLabel?.setPosition(questX, questY);
    this.questHint?.setPosition(questX, questY + this.questRadius + 12);
  }

  destroy() {
    if (this._onPointerDown) this.scene.input.off("pointerdown", this._onPointerDown);
    if (this._onPointerMove) this.scene.input.off("pointermove", this._onPointerMove);
    if (this._onPointerUp) this.scene.input.off("pointerup", this._onPointerUp);

    this.base?.destroy();
    this.thumb?.destroy();
    this.baseHint?.destroy();
    this.interactButton?.destroy();
    this.interactLabel?.destroy();
    this.interactHint?.destroy();
    this.questButton?.destroy();
    this.questLabel?.destroy();
    this.questHint?.destroy();
  }
}
