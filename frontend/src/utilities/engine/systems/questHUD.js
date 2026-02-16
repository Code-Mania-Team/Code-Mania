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
    this.contentLeft = 80;
    this.bodyBaseY = 120;
    this.contentWidth = width - 160;
    this.padding = 20;
    this.gap = 16;
    this.bodyScroll = 0;
    this.bodyScrollMax = 0;
    // Scrollbar properties
    this.scrollbarWidth = 8;
    this.scrollbarX =
      this.contentLeft + this.contentWidth - this.scrollbarWidth - 5;
    this.scrollbarMinY = this.bodyBaseY;
    this.scrollbarHeight = 0;
    this.scrollbarY = 0;
    // =========================
    // Container
    // =========================
    this.container = scene.add
      .container(0, 0)
      .setDepth(1000)
      .setScrollFactor(0)
      .setVisible(false);
    // =========================
    // Background Panel
    // =========================
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x2b1a12, 1);
    this.bg.lineStyle(4, 0x8b5e3c, 1);
    this.bg.fillRoundedRect(
      this.panelLeft,
      this.panelTop,
      this.panelWidth,
      this.panelHeight,
      16,
    );
    this.bg.strokeRoundedRect(
      this.panelLeft,
      this.panelTop,
      this.panelWidth,
      this.panelHeight,
      16,
    );
    // =========================
    // Lesson Title
    // =========================
    this.titleText = scene.add
      .text(width / 2, 90, "", {
        fontSize: "32px",
        color: "#ffd37a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    // =========================
    // Lesson Body (Header + Description)
    // =========================
    this.bodyText = scene.add.text(this.contentLeft, this.bodyBaseY, "", {
      fontSize: "20px",
      color: "#f5f0d6",
      lineSpacing: 12,
      wordWrap: { width: this.contentWidth },
    });
    // =========================
    // Example Code Block
    // =========================
    this.codeText = scene.add.text(this.contentLeft, height - 150, "", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#a8ff60",
      backgroundColor: "#1e1e1e",
      padding: { left: 12, right: 12, top: 10, bottom: 10 },
      wordWrap: { width: this.contentWidth },
    });
    // =========================
    // Scrollbar Track
    // =========================
    this.scrollbarTrack = scene.add.graphics();
    this.scrollbarTrack.fillStyle(0x4a3426, 0.8);
    this.scrollbarTrack.fillRoundedRect(
      this.scrollbarX,
      this.scrollbarMinY,
      this.scrollbarWidth,
      200,
      4,
    );
    // =========================
    // Scrollbar Thumb
    // =========================
    this.scrollbarThumb = scene.add.graphics();
    this.scrollbarThumb.fillStyle(0x8b5e3c, 1);
    this.scrollbarThumb.fillRoundedRect(
      this.scrollbarX,
      this.scrollbarMinY,
      this.scrollbarWidth,
      40,
      4,
    );
    this.bodyMaskGraphics = scene.add.graphics();
    this.bodyMaskGraphics.fillStyle(0xffffff, 1);
    this.bodyMaskGraphics.fillRect(
      this.contentLeft,
      this.bodyBaseY,
      this.contentWidth,
      1,
    );
    this.bodyMaskGraphics.setAlpha(0);
    this.bodyMaskGraphics.setScrollFactor(0);
    this.bodyMask = this.bodyMaskGraphics.createGeometryMask();
    this.bodyText.setMask(this.bodyMask);
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
      this.bodyScroll = Phaser.Math.Clamp(
        this.bodyScroll + deltaY,
        0,
        this.bodyScrollMax,
      );
      this.bodyText.y = this.bodyBaseY - this.bodyScroll;
      // Update scrollbar thumb position
      this.updateScrollbar();
    };
    scene.input.on("wheel", this.onWheel);
    // =========================
    // Add to container
    // =========================
    this.container.add([
      this.bg,
      this.titleText,
      this.bodyText,
      this.codeText,
      this.scrollbarTrack,
      this.scrollbarThumb,
      this.bodyMaskGraphics,
    ]);
  }
  // =========================
  // Show Quest Lesson
  // =========================
  showQuest(quest) {
    if (!quest) return;
    this.ignoreWheelUntil = this.scene.time.now + 250;
    // 🛑 Pause game when quest HUD appears
    window.dispatchEvent(new CustomEvent("code-mania:terminal-active"));
    // 🚫 Prevent page scrolling when quest HUD is active
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    // Lesson title
    this.titleText.setText(quest.title || "");
    // Build lesson body
    let body = "";
    if (quest.lessonHeader) {
      body += quest.lessonHeader + "\n\n";
    }
    if (quest.description) {
      body += quest.description;
    }
    this.bodyText.setText(body);
    const panelBottom = this.panelTop + this.panelHeight;
    // Example code
    if (quest.lessonExample) {
      this.codeText.setText(quest.lessonExample).setVisible(true);
    } else {
      this.codeText.setVisible(false);
    }
    this.bodyScroll = 0;
    this.bodyText.x = this.contentLeft;
    this.bodyText.y = this.bodyBaseY;
    let codeTop = panelBottom - this.padding;
    if (this.codeText.visible) {
      const bodyHeight = this.bodyText.getBounds().height;
      const desiredCodeY = this.bodyBaseY + bodyHeight + this.gap;
      const codeHeight = this.codeText.getBounds().height;
      const maxCodeY = panelBottom - this.padding - codeHeight;
      this.codeText.x = this.contentLeft;
      this.codeText.y = Math.min(desiredCodeY, maxCodeY);
      codeTop = this.codeText.y;
    }
    const bodyMaskHeight = Math.max(1, codeTop - this.gap - this.bodyBaseY);
    this.bodyMaskGraphics.clear();
    this.bodyMaskGraphics.fillStyle(0xffffff, 1);
    this.bodyMaskGraphics.fillRect(
      this.contentLeft,
      this.bodyBaseY,
      this.contentWidth,
      bodyMaskHeight,
    );
    this.bodyMaskGraphics.setAlpha(0);
    this.bodyScrollMax = Math.max(
      0,
      this.bodyText.getBounds().height - bodyMaskHeight,
    );
    // Update scrollbar visibility and positioning
    if (this.bodyScrollMax > 0) {
      this.scrollbarTrack.setVisible(true);
      this.scrollbarThumb.setVisible(true);
      // Update track height to match the scrollable area
      this.scrollbarTrack.clear();
      this.scrollbarTrack.fillStyle(0x4a3426, 0.8);
      this.scrollbarTrack.fillRoundedRect(
        this.scrollbarX,
        this.scrollbarMinY,
        this.scrollbarWidth,
        bodyMaskHeight,
        4,
      );
      // Store the track height for use in updateScrollbar
      this.scrollbarTrack.height = bodyMaskHeight;
      this.updateScrollbar();
    } else {
      this.scrollbarTrack.setVisible(false);
      this.scrollbarThumb.setVisible(false);
    }
    // Animate in
    this.container.setVisible(true);
    this.container.y = -500;
    this.scene.tweens.add({
      targets: this.container,
      y: 0,
      duration: 500,
      ease: "Back.Out",
    });
    this.visible = true;
  }
  // =========================
  // Hide Quest Lesson
  // =========================
  hide() {
    if (!this.visible) return;
    // ▶ Resume game when quest HUD hides
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
      },
    });
  }
  toggle(quest) {
    this.visible ? this.hide() : this.showQuest(quest);
  }
  // =========================
  // Update Scrollbar Position
  // =========================
  updateScrollbar() {
    if (this.bodyScrollMax <= 0) return;
    // Get the actual track height from the showQuest method
    const trackHeight = this.scrollbarTrack.height || this.panelHeight - 240;
    const contentHeight = this.bodyText.getBounds().height;
    const visibleHeight = trackHeight;
    // Calculate thumb height based on visible content ratio
    const thumbHeight = Math.max(
      30,
      (visibleHeight / contentHeight) * visibleHeight,
    );
    // Calculate scroll position (0 to 1)
    const scrollRatio = this.bodyScroll / this.bodyScrollMax;
    // Calculate thumb Y position
    const maxThumbY = this.scrollbarMinY + trackHeight - thumbHeight;
    const thumbY =
      this.scrollbarMinY + (maxThumbY - this.scrollbarMinY) * scrollRatio;
    this.scrollbarThumb.clear();
    this.scrollbarThumb.fillStyle(0x8b5e3c, 1);
    this.scrollbarThumb.fillRoundedRect(
      this.scrollbarX,
      thumbY,
      this.scrollbarWidth,
      thumbHeight,
      4,
    );
  }
}
