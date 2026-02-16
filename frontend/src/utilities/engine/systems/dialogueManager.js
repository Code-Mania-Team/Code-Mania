export default class DialogueManager {
  constructor(scene) {
    this.scene = scene;
    this.index = 0;
    this.active = false;

    const { width, height } = scene.scale;

    // RPG-style text box
    this.box = scene.add.rectangle(width / 2, height - 120, width * 0.8, 120, 0x000000, 0.85)
      .setScrollFactor(0)
      .setDepth(10000)
      .setVisible(false)
      .setStrokeStyle(3, 0xffffff);

    this.text = scene.add.text(width / 2, height - 120, "", {
      font: "22px Georgia",
      fill: "#ffffff",
      align: "center",
      wordWrap: { width: width * 0.7 }
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001)
      .setVisible(false);

    scene.input.on("pointerdown", (pointer) => {
      // Only left click
      if (pointer.button !== 0) return;

      // If terminal is active, do nothing
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
    this.text.setText(this.lines[this.index]);
  }

  next() {
    this.index++;
    if (this.index >= this.lines.length) {
      this.end();
    } else {
      this.text.setText(this.lines[this.index]);
    }
  }

  end() {
    this.box.setVisible(false);
    this.text.setVisible(false);
    this.active = false;
    this.onComplete?.();
  }
}
