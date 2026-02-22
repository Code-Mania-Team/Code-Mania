export default class DialogueManager {
  constructor(scene) {
    this.scene = scene;
    this.index = 0;
    this.active = false;

    const { width, height } = scene.scale;

    // 🔲 Dialogue Box
    this.box = scene.add
      .rectangle(width / 2, height - 120, width * 0.8, 120, 0x000000, 0.85)
      .setScrollFactor(0)
      .setDepth(10000)
      .setVisible(false)
      .setStrokeStyle(3, 0xffffff);

    // 📝 Dialogue Text
    this.text = scene.add
      .text(width / 2, height - 110, "", {
        font: "22px Georgia",
        fill: "#ffffff",
        align: "center",
        wordWrap: { width: width * 0.7 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001)
      .setVisible(false);

    // 🧑 Speaker Name (NEW)
    this.speakerName = scene.add
      .text(width * 0.2, height - 180, "", {
        font: "18px Georgia",
        fill: "#ffd700",
      })
      .setScrollFactor(0)
      .setDepth(10002)
      .setVisible(false);

    // 👆 Click to continue
    scene.input.on("pointerdown", (pointer) => {
      if (pointer.button !== 0) return;

      if (window.__CODE_MANIA_TERMINAL_ACTIVE__) return;

      if (this.active) {
        this.next();
      }
    });
  }

  startDialogue(lines, onComplete) {
    if (!lines || lines.length === 0) {
      onComplete?.();
      return;
    }

    this.lines = lines;
    this.index = 0;
    this.onComplete = onComplete;
    this.active = true;

    this.box.setVisible(true);
    this.text.setVisible(true);
    this.speakerName.setVisible(true);

    this.displayCurrentLine();
  }

  next() {
    this.index++;

    if (this.index >= this.lines.length) {
      this.end();
    } else {
      this.displayCurrentLine();
    }
  }

  displayCurrentLine() {
    const line = this.lines[this.index];

    const text = typeof line === "string" ? line : line.text;

    const speaker = typeof line === "string" ? "npc" : line.speaker;

    this.text.setText(text);

    // 🔥 Speaker Name Logic
    if (speaker === "npc") {
      this.speakerName.setText("Elder Sage");
    } else if (speaker === "player") {
      this.speakerName.setText("You");
    } else {
      this.speakerName.setText("");
    }
  }

  end() {
    this.box.setVisible(false);
    this.text.setVisible(false);
    this.speakerName.setVisible(false);

    this.active = false;
    this.onComplete?.();
  }
}
