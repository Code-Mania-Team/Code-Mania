export const CUTSCENES = {
  map1_intro: (scene) => [
    async () => {
      const npc = scene.physics.add.sprite(100, 100, "player-left");
      npc.setScale(scene.player.scaleX);

      npc.body.setSize(
        npc.width * 0.6,
        npc.height * 0.6,
        true
      );

      // collide with map
      const foreground = scene.mapLoader.layers["Foreground"];
      scene.physics.add.collider(npc, foreground);

      scene.npc = npc;
    },
    async () => {
      await scene.cutscene.moveNPC(scene.npc, scene.player.x - 40, scene.player.y);
    },
    async () => {
      await scene.cutscene.showDialogue("Hey! Welcome to Map 1! Let's get this journey started 😎✨");
    },
    async () => {
      await scene.cutscene.showDialogue("Press SPACE to continue playing!");
    }
  ]
};
