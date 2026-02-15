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
    return this.quests.find(q => q.id === id);
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


  completeQuest(id) {
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

    window.dispatchEvent(
      new CustomEvent("code-mania:quest-complete", {
        detail: { questId: id }
      })
    );

    console.log("🏁 QUEST COMPLETED:", quest.title);
    let exitTarget = null;

    this.scene.mapExits?.children?.iterate(zone => {
    if (Number(zone.exitData?.requiredQuest) === id) {
      zone.exitArrow?.setVisible(true);
      exitTarget = zone;
    }
    });

    // 🎯 Switch pointer to exit
    if (exitTarget) {
      this.scene.questPointer?.setTarget(exitTarget);
    }
  }
}
