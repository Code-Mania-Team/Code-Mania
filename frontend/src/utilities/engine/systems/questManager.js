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
    this.scene.questHUD.showQuest(quest);
  }


}
