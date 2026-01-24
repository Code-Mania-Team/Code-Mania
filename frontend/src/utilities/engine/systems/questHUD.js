import Phaser from "phaser";

export default class QuestUI {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;

    const { width, height } = scene.scale;

    // =========================
    // Container
    // =========================
    this.container = scene.add.container(0, 0)
      .setDepth(200)
      .setScrollFactor(0)
      .setVisible(false);

    // =========================
    // Background Panel
    // =========================
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x2b1a12, 1);
    this.bg.lineStyle(4, 0x8b5e3c, 1);
    this.bg.fillRoundedRect(
      width / 2 - 260,
      height / 2 - 220,
      520,
      440,
      16
    );
    this.bg.strokeRoundedRect(
      width / 2 - 260,
      height / 2 - 220,
      520,
      440,
      16
    );

    // =========================
    // Quest Title
    // =========================
    this.titleText = scene.add.text(
      width / 2,
      height / 2 - 190,
      "",
      {
        fontSize: "26px",
        color: "#ffd37a",
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    // =========================
    // Body Text (Dialogue + Lesson)
    // =========================
    this.bodyText = scene.add.text(
      width / 2 - 230,
      height / 2 - 150,
      "",
      {
        fontSize: "18px",
        color: "#f5f0d6",
        lineSpacing: 8,
        wordWrap: { width: 460 }
      }
    );

    // =========================
    // Example Code Block
    // =========================
    this.codeText = scene.add.text(
      width / 2 - 230,
      height / 2 + 60,
      "",
      {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#a8ff60",
        backgroundColor: "#1e1e1e",
        padding: { left: 10, right: 10, top: 8, bottom: 8 }
      }
    );

    // =========================
    // Continue / Complete Button
    // =========================
    this.completeBtn = scene.add.text(
      width / 2,
      height / 2 + 170,
      "Continue",
      {
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#4caf50",
        padding: { left: 24, right: 24, top: 10, bottom: 10 }
      }
    )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // =========================
    // Add to container
    // =========================
    this.container.add([
      this.bg,
      this.titleText,
      this.bodyText,
      this.codeText,
      this.completeBtn
    ]);
  }

  // =========================
  // Show Quest
  // =========================
  showQuest(quest) {
    if (!quest) return;

    // Title
    this.titleText.setText(quest.title);

    // Build body content
    let body = "";

    if (quest.dialogue?.length) {
      body += quest.dialogue.join("\n") + "\n\n";
    }

    if (quest.lessonHeader) {
      body += quest.lessonHeader + "\n";
    }

    if (quest.description) {
      body += quest.description;
    }

    this.bodyText.setText(body);

    // Code example
    if (quest.lessonExample) {
      this.codeText
        .setText(quest.lessonExample)
        .setVisible(true);
    } else {
      this.codeText.setVisible(false);
    }

    // Animate in
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

  // =========================
  // Hide Quest
  // =========================
  hide() {
    if (!this.visible) return;

    this.scene.tweens.add({
      targets: this.container,
      y: -500,
      duration: 400,
      ease: "Back.In",
      onComplete: () => {
        this.container.setVisible(false);
        this.visible = false;
      }
    });
  }

  toggle(quest) {
    this.visible ? this.hide() : this.showQuest(quest);
  }
}
