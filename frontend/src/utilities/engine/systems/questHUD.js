import Phaser from "phaser";

import { inferPrismLanguage, renderQuestRichHtml } from "../ui/questRichText";

let prismReadyPromise = null;

const ensurePrismReady = () => {
  if (prismReadyPromise) return prismReadyPromise;

  prismReadyPromise = (async () => {
    // prismjs language components expect a global `Prism` variable.
    // Use dynamic imports to guarantee initialization order.
    const existing = globalThis.Prism;
    if (existing?.languages && typeof existing.highlightAllUnder === "function") {
      return existing;
    }

    const prismMod = await import("prismjs");
    const Prism = prismMod?.default || prismMod;
    globalThis.Prism = Prism;

    // Load languages (order matters: javascript/cpp depend on clike)
    await import("prismjs/components/prism-clike");
    await import("prismjs/components/prism-javascript");
    await import("prismjs/components/prism-python");
    await import("prismjs/components/prism-cpp");

    return Prism;
  })().catch((err) => {
    // If Prism fails to init, keep the HUD usable without highlighting.
    prismReadyPromise = null;
    console.warn("Prism failed to initialize:", err);
    return null;
  });

  return prismReadyPromise;
};

export default class QuestUI {
  constructor(scene) {
    this.scene = scene;
    this.isMobile =
      scene.sys.game.device.os.android ||
      scene.sys.game.device.os.iOS;
    this.visible = false;
    this.ignoreWheelUntil = 0;

    const { width, height } = scene.scale;

    this.panelHorizontalPad = Math.max(40, Math.round(width * 0.12));
    this.panelLeft = this.panelHorizontalPad;
    this.panelTop = 50;
    this.panelWidth = width - this.panelHorizontalPad * 2;
    this.panelHeight = height - 100;

    this.titleY = 90;
    this.bodyBaseY = 130;

    this.scrollbarWidth = 8;

    // Mobile scrollbar can overlap the task block background; keep extra gutter.
    this.scrollbarPadding = this.isMobile ? 22 : 14;

    const contentInsetLeft = this.isMobile ? 22 : 30;
    const contentInsetRight = this.isMobile ? 18 : 30;

    this.contentLeft = this.panelLeft + contentInsetLeft;
    this.scrollbarX = this.panelLeft + this.panelWidth - contentInsetRight - this.scrollbarWidth;
    this.contentWidth = Math.max(80, this.scrollbarX - this.contentLeft - this.scrollbarPadding);
    this.scrollbarMinY = this.bodyBaseY;

    this.panelBottomPad = 20;
    this.bodyMaskHeight = this.panelHeight - (this.bodyBaseY - this.panelTop) - this.panelBottomPad;

    this.bodyScroll = 0;
    this.bodyScrollMax = 0;
    this._taskBaseY = 0;
    this._GAP = 16;

    // DOM-based rich quest rendering (syntax highlighting)
    this._useRichDom = true;
    this._richContentHeight = 0;
    this.isDraggingScroll = false;
    this.dragPointerId = null;
    this.lastDragY = 0;
    this.isDraggingThumb = false;
    this.thumbDragOffsetY = 0;

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
      fontSize: this.isMobile ? "16px" : "32px",
      color: "#ffd37a",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: this.panelWidth - 56, useAdvancedWrap: true }
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
      fontSize: "18px",
      color: "#f5f0d6",
      lineSpacing: 8,
      wordWrap: { width: this.contentWidth }
    });

    // 2. task — green challenge block shown at the END of description
    this.taskText = scene.add.text(this.contentLeft, this.bodyBaseY, "", {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: "18px",
      color: "#a8ff60",
      backgroundColor: "#0d2b00",
      padding: { left: 14, right: 14, top: 12, bottom: 12 },
      wordWrap: { width: this.contentWidth }
    }).setVisible(false);

    // Rich quest HTML (Prism) inside Phaser DOMElement.
    // Note: DOMElements do not participate in Phaser Containers.
    // We keep it aligned with the panel by syncing its position to this.container.
    this.richWrapperEl = document.createElement("div");
    this.richWrapperEl.style.width = `${this.contentWidth}px`;
    this.richWrapperEl.style.height = `${this.bodyMaskHeight}px`;
    this.richWrapperEl.style.overflow = "hidden";
    this.richWrapperEl.style.pointerEvents = "none";

    this.richContentEl = document.createElement("div");
    this.richContentEl.style.transform = "translateY(0px)";
    this.richContentEl.style.willChange = "transform";
    this.richWrapperEl.appendChild(this.richContentEl);

    this.bodyDom = scene.add
      .dom(this.contentLeft, this.bodyBaseY, this.richWrapperEl)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1001)
      .setVisible(false);

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

    this._endDrag = (pointerId = null) => {
      if (!this.isDraggingScroll) return;
      if (pointerId !== null && pointerId !== this.dragPointerId) return;

      this.isDraggingScroll = false;
      this.dragPointerId = null;
      this.isDraggingThumb = false;
      this.thumbDragOffsetY = 0;
    };

    this.onWheel = (pointer, gameObjects, deltaX, deltaY) => {
      if (!this.visible) return;
      if (this.scene.time.now < this.ignoreWheelUntil) return;
      if (this.bodyScrollMax <= 0) return;

      const insidePanel = this._isInsidePanel(pointer.x, pointer.y);

      if (!insidePanel) return;

      this.bodyScroll = Phaser.Math.Clamp(this.bodyScroll + deltaY, 0, this.bodyScrollMax);
      this._applyScroll();
      this._updateScrollbarThumb();
    };

    this.onPointerDown = (pointer) => {
      if (!this.visible) return;
      if (this.bodyScrollMax <= 0) return;
      if (!this._isInsideScrollArea(pointer.x, pointer.y)) return;

      if (typeof pointer.button === "number" && pointer.button !== 0) return;

      const insideTrack = this._isInsideScrollbarTrack(pointer.x, pointer.y);
      if (!this.isMobile && !insideTrack) return;

      const { thumbY, thumbHeight } = this._getThumbMetrics();
      const insideThumb = this._isInsideScrollbarThumb(pointer.x, pointer.y, thumbY, thumbHeight);

      this.isDraggingScroll = true;
      this.dragPointerId = pointer.id;
      this.lastDragY = pointer.y;

      if (!this.isMobile && insideTrack && !insideThumb) {
        this._setScrollFromTrackY(pointer.y);
      }

      this.isDraggingThumb = !this.isMobile && (insideThumb || insideTrack);
      this.thumbDragOffsetY = insideThumb ? pointer.y - thumbY : thumbHeight / 2;
    };

    this.onPointerMove = (pointer) => {
      if (!this.visible) return;
      if (!this.isDraggingScroll) return;
      if (pointer.id !== this.dragPointerId) return;
      if (this.bodyScrollMax <= 0) return;

      if (!pointer.isDown) {
        this._endDrag(pointer.id);
        return;
      }

      if (!this.isMobile && this.isDraggingThumb) {
        this._setScrollFromTrackY(pointer.y - this.thumbDragOffsetY);
        this.lastDragY = pointer.y;
        return;
      }

      if (this.isDraggingThumb && this._isInsideScrollbarTrack(pointer.x, pointer.y)) {
        this._setScrollFromTrackY(pointer.y - this.thumbDragOffsetY);
        this.lastDragY = pointer.y;
        return;
      }

      const deltaY = this.isMobile
        ? this.lastDragY - pointer.y
        : pointer.y - this.lastDragY;
      this.lastDragY = pointer.y;

      this.bodyScroll = Phaser.Math.Clamp(this.bodyScroll + deltaY, 0, this.bodyScrollMax);
      this._applyScroll();
      this._updateScrollbarThumb();
    };

    this.onPointerUp = (pointer) => {
      this._endDrag(pointer.id);
    };

    this.onGameOut = () => {
      this._endDrag();
    };

    scene.input.on("wheel", this.onWheel);
    scene.input.on("pointerdown", this.onPointerDown);
    scene.input.on("pointermove", this.onPointerMove);
    scene.input.on("pointerup", this.onPointerUp);
    scene.input.on("gameout", this.onGameOut);

    scene.events.once("shutdown", () => {
      scene.input.off("wheel", this.onWheel);
      scene.input.off("pointerdown", this.onPointerDown);
      scene.input.off("pointermove", this.onPointerMove);
      scene.input.off("pointerup", this.onPointerUp);
      scene.input.off("gameout", this.onGameOut);

      this.bodyDom?.destroy();
      this.bodyDom = null;
    });

    this.container.add([
      this.bg,
      this.divider,
      this.titleText,
      this.bodyText,
      this.taskText,
      this.bodyMaskGraphics,
      this.scrollbarTrack,
      this.scrollbarThumb,
    ]);

    this._syncDomPosition = () => {
      if (!this.bodyDom) return;
      // Follow the animated container Y offset.
      this.bodyDom.x = this.contentLeft;
      this.bodyDom.y = this.bodyBaseY + (this.container?.y || 0);
    };

    this._syncDomPosition();
  }

  showQuest(quest) {
    if (!quest) return;

    this.ignoreWheelUntil = this.scene.time.now + 250;

    window.dispatchEvent(new CustomEvent("code-mania:terminal-active"));

    this.titleText.setText(quest.title || "");

    const lessonHeader = quest.lessonHeader || quest.lesson_header || "";
    const description = quest.description || "";
    const task = quest.task || "";

    if (this._useRichDom && this.bodyDom && this.richContentEl) {
      // Render into DOM with syntax highlighting.
      const prismLanguage = inferPrismLanguage(quest);
      const html = renderQuestRichHtml({
        lessonHeader,
        description,
        task,
        prismLanguage,
      });

      this.richContentEl.innerHTML = html;
      this.bodyDom.setVisible(true);
      this._syncDomPosition();

      // Hide canvas texts to avoid duplicate rendering.
      this.bodyText.setText("").setVisible(false);
      this.taskText.setText("").setVisible(false);
    } else {
      // Fallback: canvas-only text (no syntax highlight)
      let body = "";
      if (lessonHeader) body += lessonHeader + "\n\n";
      if (description) body += description;
      this.bodyText.setText(body).setVisible(true);
      this.bodyDom?.setVisible(false);
    }

    // Reset
    this.bodyScroll = 0;
    this.bodyText.setPosition(this.contentLeft, this.bodyBaseY);
    this.taskText.setVisible(false);
    this._taskBaseY = 0;

    this._applyScroll();

    // Let DOM/canvas settle, then compute scroll.
    this.scene.time.delayedCall(0, () => {
      if (this._useRichDom && this.bodyDom?.visible && this.richContentEl) {
        (async () => {
          const Prism = await ensurePrismReady();
          if (Prism) {
            try {
              Prism.highlightAllUnder(this.richContentEl);
            } catch {
              // Highlighting is best-effort.
            }
          }

          // Measure after highlight (or immediately if Prism isn't available).
          this.scene.time.delayedCall(0, () => {
            this._richContentHeight = Math.max(0, Math.ceil(this.richContentEl.scrollHeight || 0));
            this.bodyScrollMax = Math.max(0, this._getTotalContentHeight() - this.bodyMaskHeight);

            this._drawScrollbarTrack();
            this._updateScrollbarThumb();
            this.scrollbarTrack.setVisible(this.bodyScrollMax > 0);
            this.scrollbarThumb.setVisible(this.bodyScrollMax > 0);
          });
        })();
        return;
      }

      // Canvas fallback path
      const bodyBottom = this.bodyText.y + this.bodyText.height;
      if (quest.task) {
        this._taskBaseY = bodyBottom + this._GAP;
        this.taskText
          .setText(quest.task)
          .setVisible(true)
          .setPosition(this.contentLeft, this._taskBaseY);
      }

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
      ease: "Back.Out",
      onUpdate: () => {
        this._syncDomPosition?.();
      }
    });

    this._syncDomPosition?.();

    this.visible = true;
  }

  hide() {
    if (!this.visible) return;

    this.isDraggingScroll = false;
    this.dragPointerId = null;
    this.isDraggingThumb = false;
    this.thumbDragOffsetY = 0;

    window.dispatchEvent(new CustomEvent("code-mania:terminal-inactive"));

    this.scene.tweens.add({
      targets: this.container,
      y: -500,
      duration: 400,
      ease: "Back.In",
      onUpdate: () => {
        this._syncDomPosition?.();
      },
      onComplete: () => {
        this.container.setVisible(false);
        this.visible = false;
        this.bodyScroll = 0;

        this.bodyDom?.setVisible(false);
      }
    });
  }

  toggle(quest) {
    this.visible ? this.hide() : this.showQuest(quest);
  }

  _isInsidePanel(x, y) {
    return (
      x >= this.panelLeft &&
      x <= this.panelLeft + this.panelWidth &&
      y >= this.panelTop &&
      y <= this.panelTop + this.panelHeight
    );
  }

  _isInsideScrollArea(x, y) {
    return (
      x >= this.contentLeft &&
      x <= this.contentLeft + this.contentWidth + this.scrollbarWidth + this.scrollbarPadding &&
      y >= this.bodyBaseY &&
      y <= this.bodyBaseY + this.bodyMaskHeight
    );
  }

  _isInsideScrollbarTrack(x, y) {
    return (
      x >= this.scrollbarX - 6 &&
      x <= this.scrollbarX + this.scrollbarWidth + 6 &&
      y >= this.scrollbarMinY &&
      y <= this.scrollbarMinY + this.bodyMaskHeight
    );
  }

  _isInsideScrollbarThumb(x, y, thumbY, thumbHeight) {
    return (
      x >= this.scrollbarX - 8 &&
      x <= this.scrollbarX + this.scrollbarWidth + 8 &&
      y >= thumbY &&
      y <= thumbY + thumbHeight
    );
  }

  _getTotalContentHeight() {
    if (this._useRichDom && this.bodyDom?.visible) {
      return Math.max(0, Number(this._richContentHeight) || 0);
    }

    let bottom = this.bodyBaseY + this.bodyText.height;
    if (this.taskText.visible) bottom = Math.max(bottom, this._taskBaseY + this.taskText.height);
    return Math.max(0, bottom - this.bodyBaseY);
  }

  _applyScroll() {
    const offset = this.bodyScroll;

    if (this._useRichDom && this.bodyDom?.visible && this.richContentEl) {
      this.richContentEl.style.transform = `translateY(${-offset}px)`;
      return;
    }

    this.bodyText.y = this.bodyBaseY - offset;
    if (this.taskText.visible && this._taskBaseY > 0) this.taskText.y = this._taskBaseY - offset;
  }

  _drawScrollbarTrack() {
    this.scrollbarTrack.clear();
    this.scrollbarTrack.fillStyle(0x4a3426, 0.8);
    this.scrollbarTrack.fillRoundedRect(
      this.scrollbarX, this.scrollbarMinY, this.scrollbarWidth, this.bodyMaskHeight, 4
    );
  }

  _getThumbMetrics() {
    const trackHeight = this.bodyMaskHeight;
    const totalContentHeight = Math.max(trackHeight, this._getTotalContentHeight());
    const thumbHeight = Math.max(30, (trackHeight / totalContentHeight) * trackHeight);
    const scrollRatio = this.bodyScrollMax > 0 ? this.bodyScroll / this.bodyScrollMax : 0;
    const maxThumbOffset = Math.max(0, trackHeight - thumbHeight);
    const thumbY = this.scrollbarMinY + maxThumbOffset * scrollRatio;

    return { thumbHeight, thumbY, maxThumbOffset };
  }

  _setScrollFromTrackY(trackY) {
    if (this.bodyScrollMax <= 0) return;
    const { thumbHeight, maxThumbOffset } = this._getThumbMetrics();
    const minY = this.scrollbarMinY;
    const maxY = this.scrollbarMinY + this.bodyMaskHeight - thumbHeight;
    const clampedThumbY = Phaser.Math.Clamp(trackY, minY, maxY);
    const ratio = maxThumbOffset > 0 ? (clampedThumbY - this.scrollbarMinY) / maxThumbOffset : 0;

    this.bodyScroll = Phaser.Math.Clamp(ratio * this.bodyScrollMax, 0, this.bodyScrollMax);
    this._applyScroll();
    this._updateScrollbarThumb();
  }

  _updateScrollbarThumb() {
    if (this.bodyScrollMax <= 0) return;

    const { thumbHeight, thumbY } = this._getThumbMetrics();

    this.scrollbarThumb.clear();
    this.scrollbarThumb.fillStyle(0x8b5e3c, 1);
    this.scrollbarThumb.fillRoundedRect(
      this.scrollbarX, thumbY, this.scrollbarWidth, thumbHeight, 4
    );
  }
}
