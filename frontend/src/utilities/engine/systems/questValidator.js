export default class QuestValidator {
  constructor(scene) {
    this.scene = scene;
    this.onTerminalResult = this.onTerminalResult.bind(this);

    window.addEventListener(
      "code-mania:terminal-result",
      this.onTerminalResult,
    );

    scene.events.once("shutdown", () => {
      window.removeEventListener(
        "code-mania:terminal-result",
        this.onTerminalResult,
      );
    });
  }

  // -------------------------
  // Helpers
  // -------------------------
  normalize(text = "") {
    return text
      .replace(/^▶ Running.*\n?/i, "") // remove terminal banner
      .replace(/\r\n/g, "\n")
      .trim();
  }

  validateMustInclude(code = "", requirements) {
    if (!requirements?.mustInclude) return true;

    return requirements.mustInclude.every((token) => code.includes(token));
  }

  getValidationMode(quest) {
    if (quest.title?.toLowerCase().includes("exam")) {
      return "STRICT";
    }

    if (quest.expectedOutput && quest.requirements?.mustInclude) {
      return "HYBRID";
    }

    if (quest.requirements?.mustInclude) {
      return "FUNDAMENTALS";
    }

    return "STRICT";
  }

  // -------------------------
  // Main handler
  // -------------------------
  onTerminalResult(e) {
    const { output, error } = e.detail;
    const quest = this.scene.questManager.activeQuest;
    if (!quest || quest.completed) return;

    if (error) {
      this.scene.dialogueManager.startDialogue([
        "Your code has an error.",
        "Fix it and try again.",
      ]);
      return;
    }

    // Get last submitted code (store this when user clicks Run)
    const userCode = localStorage.getItem("lastSubmittedCode") || "";

    const actual = this.normalize(output);
    const expected = quest.expectedOutput
      ? this.normalize(quest.expectedOutput)
      : null;

    const mode = this.getValidationMode(quest);

    console.log("🧪 VALIDATION MODE:", mode);
    console.log("🧪 actual:", JSON.stringify(actual));
    console.log("🧪 expected:", JSON.stringify(expected));

    // -------------------------
    // MODE: FUNDAMENTALS
    // -------------------------
    if (mode === "FUNDAMENTALS") {
      const ok = this.validateMustInclude(userCode, quest.requirements);

      if (!ok) {
        this.scene.dialogueManager.startDialogue([
          "You’re missing an important concept.",
          `Try using: ${quest.requirements.mustInclude.join(", ")}`,
        ]);
        return;
      }

      this.scene.questManager.completeQuest(quest.id);
      return;
    }

    // -------------------------
    // MODE: HYBRID
    // -------------------------
    if (mode === "HYBRID") {
      const fundamentalsOk = this.validateMustInclude(
        userCode,
        quest.requirements,
      );

      if (!fundamentalsOk) {
        this.scene.dialogueManager.startDialogue([
          "You’re missing a required concept.",
          `Make sure to use: ${quest.requirements.mustInclude.join(", ")}`,
        ]);
        return;
      }

      if (!actual.includes(expected)) {
        this.scene.dialogueManager.startDialogue([
          "Your code runs, but the result isn’t quite right.",
          "Check your logic and try again.",
        ]);
        return;
      }

      this.scene.questManager.completeQuest(quest.id);
      return;
    }

    // -------------------------
    // MODE: STRICT
    // -------------------------
    if (mode === "STRICT") {
      if (actual !== expected) {
        this.scene.dialogueManager.startDialogue([
          "The output is incorrect.",
          "This challenge requires an exact result.",
        ]);
        return;
      }

      this.scene.questManager.completeQuest(quest.id);
    }
  }
}
