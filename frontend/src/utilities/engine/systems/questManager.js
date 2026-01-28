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

    // Hide NPC quest icons
    this.scene.npcs?.forEach(npc => {
      if (npc.npcData?.questId === id) {
        this.scene.questIconManager?.hideForNPC(npc);
      }
    });

    // Hide chest quest icon (independent)
    this.scene.chestQuestManager?.hideIconForQuest(id);

    if (this.scene.questHUD) {
      this.scene.questHUD.showQuest(quest);
    }
  }


  completeQuest(id) {
    const quest = this.getQuestById(id);
    if (!quest) return;

    quest.completed = true;
    console.log("✅ QUEST COMPLETED:", quest.title);


    // 🔓 Unlock exits that depend on this quest
    this.scene.mapExits?.children.iterate(zone => {
      if (Number(zone.exitData?.requiredQuest) === id) {
        zone.exitArrow?.setVisible(true);
      }
    });
  }



}