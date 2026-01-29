export default class QuestManager {
  constructor(scene, quests) {
    this.scene = scene;
    this.quests = quests;

    const saved = JSON.parse(localStorage.getItem("completedQuests") || "[]");
    saved.forEach(id => {
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
    console.log("🚀 QUEST STARTED:", quest.title);

    // 🔔 Notify React (terminal unlock)
    window.dispatchEvent(
      new CustomEvent("code-mania:quest-started", {
        detail: { questId: quest.id }
      })
    );

    // 🔔 THIS WAS MISSING ❗
    window.dispatchEvent(
      new CustomEvent("code-mania:dialogue-complete", {
        detail: { questId: quest.id }
      })
    );

    // Hide icons
    this.scene.npcs?.forEach(npc => {
      if (npc.npcData?.questId === id) {
        this.scene.questIconManager?.hideForNPC(npc);
      }
    });

    this.scene.chestQuestManager?.hideIconForQuest(id);
    this.scene.questHUD?.showQuest(quest);
}


  completeQuest(id) {
    const quest = this.getQuestById(id);
    if (!quest) return;

    if (quest.completed) return;

    quest.completed = true;

    const completed = JSON.parse(localStorage.getItem("completedQuests") || "[]");
    if (!completed.includes(id)) {
      completed.push(id);
      // localStorage.setItem("completedQuests", JSON.stringify(completed));
    }

    // Clear active quest if it was this one
    if (this.activeQuest?.id === id) {
      this.activeQuest = null;
    }

    // 🔓 Unlock exits ANYWHERE that depend on this quest
    this.scene.mapExits?.children?.iterate(zone => {
      if (Number(zone.exitData?.requiredQuest) === id) {
        zone.exitArrow?.setVisible(true);
      }
    });
  }


}
