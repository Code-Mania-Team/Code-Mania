import Phaser from "phaser";

export default class HelpScene extends Phaser.Scene {
  constructor() {
    super("HelpScene");
  }

  create() {
    const { width, height } = this.scale;

    this.currentPage = 0;

    // 📖 BOOK PAGES
    this.pages = [
      {
        title: "🎮 Controls",
        content: `
Arrow Keys   —   Move
E            —   Interact
Q            —   Quest Log
H / ESC      —   Close Help
        `
      },
      {
        title: "🧑 NPCs",
        content: `
❗ Icons mark available quests.

Talk to NPCs to begin your journey.
NPCs guide you through the world.
        `
      },
      {
        title: "📜 Quests",
        content: `
• Only one quest can be active
• Quests unlock new paths
• Complete quests to progress
        `
      },
      {
        title: "🧰 Chests & Abilities",
        content: `
• Some chests are quest-locked
• Completing quests grants abilities
• Abilities permanently change gameplay
        `
      }
    ];

    // 🌑 Dark overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.65)
      .setOrigin(0)
      .setScrollFactor(0);

    // 📜 Book panel
    this.panelWidth = Math.min(760, width - 80);
    this.panelHeight = Math.min(560, height - 80);

    this.panelX = width / 2 - this.panelWidth / 2;
    this.panelY = height / 2 - this.panelHeight / 2;

    this.add.rectangle(
      this.panelX,
      this.panelY,
      this.panelWidth,
      this.panelHeight,
      0xf5e6c8
    )
      .setOrigin(0)
      .setStrokeStyle(6, 0x5a3e2b);

    // 📘 Title (top)
    this.add.text(
      width / 2,
      this.panelY + 24,
      "📖  How to Play",
      {
        fontFamily: "Georgia, serif",
        fontSize: "34px",
        color: "#3b2a1a",
        fontStyle: "bold"
      }
    ).setOrigin(0.5, 0);

    // 📄 Page title (CENTERED)
    this.pageTitle = this.add.text(
      width / 2,
      this.panelY + 90,
      "",
      {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#3b2a1a",
        fontStyle: "bold"
      }
    ).setOrigin(0.5, 0);

    // 📃 Page content (TRUE CENTER)
    this.pageText = this.add.text(
      width / 2,
      this.panelY + 145,
      "",
      {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#2e1f14",
        lineSpacing: 12,
        align: "center",
        wordWrap: { width: 420 }
      }
    ).setOrigin(0.5, 0);

    // ◀ Prev
    this.prevBtn = this.add.text(
      this.panelX + 40,
      this.panelY + this.panelHeight - 44,
      "◀ Prev",
      {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#3b2a1a"
      }
    )
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.changePage(-1));

    // ▶ Next
    this.nextBtn = this.add.text(
      this.panelX + this.panelWidth - 40,
      this.panelY + this.panelHeight - 44,
      "Next ▶",
      {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#3b2a1a"
      }
    )
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.changePage(1));

    // 📑 Page indicator
    this.pageIndicator = this.add.text(
      width / 2,
      this.panelY + this.panelHeight - 44,
      "",
      {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        color: "#3b2a1a"
      }
    ).setOrigin(0.5, 0);

    // ❌ Close button
    this.add.text(
      this.panelX + this.panelWidth - 20,
      this.panelY + 16,
      "✕",
      {
        fontSize: "24px",
        color: "#3b2a1a",
        fontStyle: "bold"
      }
    )
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.close());

    // ⌨ Keyboard navigation
    this.input.keyboard.on("keydown-LEFT", () => this.changePage(-1));
    this.input.keyboard.on("keydown-RIGHT", () => this.changePage(1));
    this.input.keyboard.once("keydown-ESC", () => this.close());
    this.input.keyboard.once("keydown-H", () => this.close());

    // Initial render
    this.renderPage();

    // 📐 Handle resize
    this.scale.on("resize", () => this.scene.restart());
  }

  changePage(dir) {
    this.currentPage = Phaser.Math.Clamp(
      this.currentPage + dir,
      0,
      this.pages.length - 1
    );
    this.renderPage();
  }

  renderPage() {
    const page = this.pages[this.currentPage];

    this.pageTitle.setText(page.title);
    this.pageText.setText(page.content.trim());

    this.pageIndicator.setText(
      `Page ${this.currentPage + 1} / ${this.pages.length}`
    );

    this.prevBtn.setAlpha(this.currentPage === 0 ? 0.3 : 1);
    this.nextBtn.setAlpha(
      this.currentPage === this.pages.length - 1 ? 0.3 : 1
    );
  }

  close() {
    this.scene.stop();
    this.scene.resume("GameScene");
  }
}
