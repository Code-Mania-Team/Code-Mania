export default class QuestManager {
  constructor(scene, quests) {
    this.scene = scene;
    this.quests = quests;
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

    // 👇 SHOW QUEST HUD
    if (this.scene.questHUD) this.scene.questHUD.showQuest(quest);
  }

  completeQuest(id) {
  const quest = this.getQuestById(id);
    if (!quest) return;

    quest.completed = true;
    console.log("✅ QUEST COMPLETED:", quest.title);

    // Remove or comment this line:
    // if (this.scene.questHUD) this.scene.questHUD.updateQuestStatus(quest);
  }

}
