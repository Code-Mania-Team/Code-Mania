export default class QuestManager {
  constructor(scene, quests, completedQuestIds = []) {
    this.scene = scene;
    this.quests = quests;

    this.completedQuestIds = new Set(completedQuestIds);
    this.completedQuestIds.forEach(id => {
      const q = this.getQuestById(id);
      if (q) q.completed = true;
    });

    this.activeQuest = null;
  }

  getQuestById(id) {
    if (!this.quests) return null;
    return this.quests.find(q => q && q.id === id) || null;
  }

  startQuest(id) {
    const quest = this.getQuestById(id);
    if (!quest) return;

    this.activeQuest = quest;

    // 🔗 Bridge to terminal
    localStorage.setItem("activeQuestId", quest.id);

    window.dispatchEvent(
      new CustomEvent("code-mania:quest-started", {
        detail: { questId: quest.id }
      })
    );

    window.dispatchEvent(
      new CustomEvent("code-mania:dialogue-complete", {
        detail: { questId: quest.id }
      })
    );

    console.log("🚀 QUEST STARTED:", quest.title);

    // ✅ HIDE NPC QUEST ICON
    this.scene.npcs?.forEach(npc => {
      if (npc.npcData?.questId === id) {
        this.scene.questIconManager?.hideForNPC(npc);
      }
    });

    // ✅ ALSO hide chest quest icons if any
    this.scene.chestQuestManager?.hideIconForQuest(id);

    this.scene.questHUD?.showQuest(quest);
  }


  completeQuest(id, { emitEvent = true } = {}) {
    const quest = this.getQuestById(id);
    console.log("📤 dispatch quest-complete", id);
    if (!quest || quest.completed) return;

    quest.completed = true;
    this.completedQuestIds.add(id);

    const completed = JSON.parse(localStorage.getItem("completedQuests") || "[]");
    if (!completed.includes(id)) {
      completed.push(id);
      // localStorage.setItem("completedQuests", JSON.stringify(completed));
    }

    if (this.activeQuest?.id === id) {
      this.activeQuest = null;
      localStorage.removeItem("activeQuestId");
    }

    this.scene.questHUD?.hide();

    if (emitEvent) {
      window.dispatchEvent(
        new CustomEvent("code-mania:quest-complete", {
          detail: { questId: id }
        })
      );
    }

    console.log("🏁 QUEST COMPLETED:", quest.title);
    let exitTarget = null;
    const questOrder = Number(quest?.order_index);

    const exitZones = this.scene.mapExits?.getChildren?.() || [];
    exitZones.forEach((zone) => {
      const required = Number(zone?.exitData?.requiredQuest);
      if (required === Number(id) || (Number.isFinite(questOrder) && required === questOrder)) {
        zone?.exitArrow?.setVisible(true);
        exitTarget = zone;
      }
    });

    // Fallback for maps without required_quest configured
    if (!exitTarget) {
      const firstExit = this.scene.mapExits?.getChildren?.()?.[0] || null;
      if (firstExit) {
        firstExit.exitArrow?.setVisible(true);
        exitTarget = firstExit;
      }
    }

    // 🎯 Switch pointer to exit
    if (exitTarget) {
      this.scene.questPointer?.setTarget(exitTarget);
    }
  }
}
