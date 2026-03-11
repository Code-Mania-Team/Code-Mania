export default class QuestManager {
  constructor(scene, quests, completedQuestIds = []) {
    this.scene = scene;
    this.quests = quests;

    const normalizedCompleted = Array.from(completedQuestIds ?? [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    this.completedQuestIds = new Set(normalizedCompleted);
    this.completedQuestIds.forEach((id) => {
      const q = this.getQuestById(id);
      if (q) q.completed = true;
    });

    this.activeQuest = null;
  }

  getQuestById(id) {
    if (!this.quests) return null;
    const targetId = Number(id);
    if (!Number.isFinite(targetId)) return null;

    return (
      this.quests.find((q) => q && Number(q.id) === targetId) || null
    );
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
    const questId = Number(id);
    if (!Number.isFinite(questId)) return;

    const quest = this.getQuestById(questId);
    if (!quest || quest.completed) return;

    quest.completed = true;
    this.completedQuestIds.add(questId);

    if (Number(this.activeQuest?.id) === questId) {
      this.activeQuest = null;
      localStorage.removeItem("activeQuestId");
    }

    this.scene.questHUD?.hide();

    if (emitEvent) {
      window.dispatchEvent(
        new CustomEvent("code-mania:quest-complete", {
          detail: { questId: questId }
        })
      );
    }

    let exitTarget = null;
    const questOrder = Number(quest?.order_index);

    const exitZones = this.scene.mapExits?.getChildren?.() || [];
    exitZones.forEach((zone) => {
      const required = Number(zone?.exitData?.requiredQuest);
      if (required === questId || (Number.isFinite(questOrder) && required === questOrder)) {
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
