export default class DialogueManager {
  constructor(scene) {
    this.scene = scene;
    this.index = 0;
    this.active = false;

    this.box = scene.add.rectangle(400, 520, 760, 120, 0x000000, 0.8)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);

    this.text = scene.add.text(60, 480, "", {
      fontSize: "16px",
      color: "#fff",
      wordWrap: { width: 680 }
    })
      .setScrollFactor(0)
      .setDepth(101)
      .setVisible(false);

    scene.input.keyboard.on("keydown-SPACE", () => {
      if (this.active) this.next();
    });
  }

  startDialogue(lines, onComplete) {
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

  update() {}
}
