export default class AchievementManager {
  constructor(scene, achievements) {
    this.scene = scene;
    this.achievements = achievements;
    this.unlocked = new Set();
  }

  checkForUnlock(questId, language) {
    const achievement = this.achievements.find(
      a =>
        a.unlockQuestId === questId &&
        a.language === language
    );

    if (!achievement) return null;

    if (this.unlocked.has(achievement.id)) return null;

    this.unlocked.add(achievement.id);
    return achievement;
  }
}
