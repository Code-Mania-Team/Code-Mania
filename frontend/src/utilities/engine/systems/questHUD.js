import Phaser from "phaser";

export default class QuestUI {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.ignoreWheelUntil = 0;

    const { width, height } = scene.scale;

    this.panelLeft = 50;
    this.panelTop = 50;
    this.panelWidth = width - 100;
    this.panelHeight = height - 100;

    this.titleY = 90;
    this.bodyBaseY = 130;

    this.scrollbarWidth = 8;
    this.scrollbarPadding = 14;
    this.contentLeft = this.panelLeft + 30;
    this.contentWidth = this.panelWidth - 60 - this.scrollbarWidth - this.scrollbarPadding;

    this.scrollbarX = this.contentLeft + this.contentWidth + this.scrollbarPadding;
    this.scrollbarMinY = this.bodyBaseY;

    this.panelBottomPad = 20;
    this.bodyMaskHeight = this.panelHeight - (this.bodyBaseY - this.panelTop) - this.panelBottomPad;

    this.bodyScroll = 0;
    this.bodyScrollMax = 0;
    this._taskBaseY = 0;
    this._GAP = 16;

    // Container
    this.container = scene.add.container(0, 0)
      .setDepth(1000)
      .setScrollFactor(0)
      .setVisible(false);

    // Background Panel
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x2b1a12, 1);
    this.bg.lineStyle(4, 0x8b5e3c, 1);
    this.bg.fillRoundedRect(this.panelLeft, this.panelTop, this.panelWidth, this.panelHeight, 16);
    this.bg.strokeRoundedRect(this.panelLeft, this.panelTop, this.panelWidth, this.panelHeight, 16);

    // Title
    this.titleText = scene.add.text(width / 2, this.titleY, "", {
      fontSize: "32px",
      color: "#ffd37a",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Divider
    this.divider = scene.add.graphics();
    this.divider.lineStyle(2, 0x8b5e3c, 0.6);
    this.divider.beginPath();
    this.divider.moveTo(this.panelLeft + 20, this.bodyBaseY - 8);
    this.divider.lineTo(this.panelLeft + this.panelWidth - 20, this.bodyBaseY - 8);
    this.divider.strokePath();

    // 1. Description — normal readable font, cream colour
    this.bodyText = scene.add.text(this.contentLeft, this.bodyBaseY, "", {
      fontFamily: "'Georgia', serif",
      fontSize: "17px",
      color: "#f5f0d6",
      lineSpacing: 8,
      wordWrap: { width: this.contentWidth }
    });

    // 2. task — green challenge block shown at the END of description
    this.taskText = scene.add.text(this.contentLeft, this.bodyBaseY, "", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: "15px",
      color: "#a8ff60",
      backgroundColor: "#0d2b00",
      padding: { left: 14, right: 14, top: 12, bottom: 12 },
      wordWrap: { width: this.contentWidth }
    }).setVisible(false);

    // Mask
    this.bodyMaskGraphics = scene.add.graphics();
    this.bodyMaskGraphics.fillStyle(0xffffff, 1);
    this.bodyMaskGraphics.fillRect(
      this.contentLeft,
      this.bodyBaseY,
      this.contentWidth + this.scrollbarWidth + this.scrollbarPadding + 10,
      this.bodyMaskHeight
    );
    this.bodyMaskGraphics.setAlpha(0);
    this.bodyMaskGraphics.setScrollFactor(0);

    this.bodyMask = this.bodyMaskGraphics.createGeometryMask();
    this.bodyText.setMask(this.bodyMask);
    this.taskText.setMask(this.bodyMask);

    this.scrollbarTrack = scene.add.graphics();
    this.scrollbarThumb = scene.add.graphics();

    // Close button (X)
    this.closeButton = scene.add.text(
      this.panelLeft + this.panelWidth - 30,
      this.panelTop + 22,
      "X",
      {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffd37a",
        fontStyle: "bold",
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001)
      .setInteractive(
        new Phaser.Geom.Rectangle(-18, -18, 36, 36),
        Phaser.Geom.Rectangle.Contains
      );

    this.closeButton.on("pointerover", () => {
      this.closeButton.setColor("#ffffff");
    });

    this.closeButton.on("pointerout", () => {
      this.closeButton.setColor("#ffd37a");
    });

    this.closeButton.on("pointerdown", () => {
      this.hide();
    });

    this.closeButton.on("pointerup", () => {
      this.hide();
    });

    this.onWheel = (pointer, gameObjects, deltaX, deltaY) => {
      if (!this.visible) return;
      if (this.scene.time.now < this.ignoreWheelUntil) return;
      if (this.bodyScrollMax <= 0) return;

      const insidePanel =
        pointer.x >= this.panelLeft &&
        pointer.x <= this.panelLeft + this.panelWidth &&
        pointer.y >= this.panelTop &&
        pointer.y <= this.panelTop + this.panelHeight;

      if (!insidePanel) return;

      this.bodyScroll = Phaser.Math.Clamp(this.bodyScroll + deltaY, 0, this.bodyScrollMax);
      this._applyScroll();
      this._updateScrollbarThumb();
    };

    scene.input.on("wheel", this.onWheel);

    this.container.add([
      this.bg,
      this.divider,
      this.titleText,
      this.bodyText,
      this.taskText,
      this.bodyMaskGraphics,
      this.scrollbarTrack,
      this.scrollbarThumb,
      this.closeButton,
    ]);
  }

  showQuest(quest) {
    if (!quest) return;

    this.ignoreWheelUntil = this.scene.time.now + 250;

    window.dispatchEvent(new CustomEvent("code-mania:terminal-active"));

    this.titleText.setText(quest.title || "");

    // Description only — lesson_example is duplicate of task, skip it
    let body = "";
    if (quest.lessonHeader) body += quest.lessonHeader + "\n\n";
    if (quest.description) body += quest.description;
    this.bodyText.setText(body);

    // Reset
    this.bodyScroll = 0;
    this.bodyText.setPosition(this.contentLeft, this.bodyBaseY);
    this.taskText.setVisible(false);
    this._taskBaseY = 0;

    // Frame 1: bodyText settles → position taskText right after it
    this.scene.time.delayedCall(0, () => {
      const bodyBottom = this.bodyText.y + this.bodyText.height;

      if (quest.task) {
        this._taskBaseY = bodyBottom + this._GAP;
        this.taskText
          .setText(quest.task)
          .setVisible(true)
          .setPosition(this.contentLeft, this._taskBaseY);
      }

      // Frame 2: taskText settles → compute scroll
      this.scene.time.delayedCall(0, () => {
        const totalContentHeight = this._getTotalContentHeight();
        this.bodyScrollMax = Math.max(0, totalContentHeight - this.bodyMaskHeight);

        this._drawScrollbarTrack();
        this._updateScrollbarThumb();

        this.scrollbarTrack.setVisible(this.bodyScrollMax > 0);
        this.scrollbarThumb.setVisible(this.bodyScrollMax > 0);
      });
    });

    this.container.setVisible(true);
    this.container.y = -500;
    this.scene.tweens.add({
      targets: this.container,
      y: 0,
      duration: 500,
      ease: "Back.Out"
    });

    this.visible = true;
  }

  hide() {
    if (!this.visible) return;

    window.dispatchEvent(new CustomEvent("code-mania:terminal-inactive"));

    this.scene.tweens.add({
      targets: this.container,
      y: -500,
      duration: 400,
      ease: "Back.In",
      onComplete: () => {
        this.container.setVisible(false);
        this.visible = false;
        this.bodyScroll = 0;
      }
    });
  }

  toggle(quest) {
    this.visible ? this.hide() : this.showQuest(quest);
  }

  _getTotalContentHeight() {
    let bottom = this.bodyText.y + this.bodyText.height;
    if (this.taskText.visible) bottom = Math.max(bottom, this.taskText.y + this.taskText.height);
    return bottom - this.bodyBaseY;
  }

  _applyScroll() {
    const offset = this.bodyScroll;
    this.bodyText.y = this.bodyBaseY - offset;
    if (this.taskText.visible && this._taskBaseY > 0) {
      this.taskText.y = this._taskBaseY - offset;
    }
  }

  _drawScrollbarTrack() {
    this.scrollbarTrack.clear();
    this.scrollbarTrack.fillStyle(0x4a3426, 0.8);
    this.scrollbarTrack.fillRoundedRect(
      this.scrollbarX, this.scrollbarMinY, this.scrollbarWidth, this.bodyMaskHeight, 4
    );
  }

  _updateScrollbarThumb() {
    if (this.bodyScrollMax <= 0) return;

    const trackHeight = this.bodyMaskHeight;
    const totalContentHeight = this._getTotalContentHeight();
    const thumbHeight = Math.max(30, (trackHeight / totalContentHeight) * trackHeight);
    const scrollRatio = this.bodyScroll / this.bodyScrollMax;
    const maxThumbOffset = trackHeight - thumbHeight;
    const thumbY = this.scrollbarMinY + maxThumbOffset * scrollRatio;

    this.scrollbarThumb.clear();
    this.scrollbarThumb.fillStyle(0x8b5e3c, 1);
    this.scrollbarThumb.fillRoundedRect(
      this.scrollbarX, thumbY, this.scrollbarWidth, thumbHeight, 4
    );
  }
}
