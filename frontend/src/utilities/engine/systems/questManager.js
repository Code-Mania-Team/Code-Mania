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

    // 🧹 Hide quest icon above NPC
    this.scene.npcs?.forEach(npc => {
      if (npc.npcData?.questId === id) {
        this.scene.questIconManager?.hideForNPC(npc);
      }
    });

    if (this.scene.questHUD) {
      this.scene.questHUD.showQuest(quest);
    }
  }

  completeQuest(id) {
    const quest = this.getQuestById(id);
    if (!quest) return;

    quest.completed = true;
    console.log("✅ QUEST COMPLETED:", quest.title);

    if (quest.grants) {
      this.scene.worldState.abilities.add(quest.grants);

      // 💾 SAVE TO LOCALSTORAGE
      localStorage.setItem(
        "abilities",
        JSON.stringify([...this.scene.worldState.abilities])
      );

      console.log("🧰 Ability unlocked & saved:", quest.grants);
    }


    // 🔓 Unlock exits that depend on this quest
    this.scene.mapExits?.children.iterate(zone => {
      if (Number(zone.exitData?.requiredQuest) === id) {
        zone.exitArrow?.setVisible(true);
      }
    });
  }



}
