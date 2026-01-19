export default class QuestManager {
  constructor(scene, quests) {
    this.scene = scene;
    this.quests = quests;
  }

  getQuestById(id) {
    return this.quests.find(q => q.id === id);
  }

  startQuest(id) {
    const quest = this.getQuestById(id);
    console.log("🚀 QUEST STARTED:", quest.title);
    // hook UI / editor / terminal here
  }
  triggerQuestFromNPC(id) {
    this.startQuest(id);
  }
}
