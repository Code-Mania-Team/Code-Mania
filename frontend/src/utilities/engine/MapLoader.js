export default class MapLoader {
  constructor(scene) {
    this.scene = scene;
    this.map = null;
    this.tileset = null;
    this.layers = {};
  }

  load(mapKey, mapJsonPath, tilesetKey, tilesetPath) {
    this.scene.load.tilemapTiledJSON(mapKey, mapJsonPath);
    this.scene.load.image(tilesetKey, tilesetPath);
  }

  create(mapKey, tilesetNameInTiled, tilesetKey) {
    this.map = this.scene.make.tilemap({ key: mapKey });
    this.tileset = this.map.addTilesetImage(tilesetNameInTiled, tilesetKey);

    // Create layers dynamically
    this.map.layers.forEach(layerData => {
      const layer = this.map.createLayer(layerData.name, this.tileset, 0, 0);
      this.layers[layerData.name] = layer;

      // If layer has tiles with "collision" property, set collisions
      layer.setCollisionByProperty({ collision: true });
    });
  }
}
