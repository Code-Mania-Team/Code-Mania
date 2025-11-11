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

    // Create all layers
    const layerNames = this.map.layers.map((l) => l.name);
    layerNames.forEach((name) => {
      const layer = this.map.createLayer(name, this.tileset, 0, 0);
      this.layers[name] = layer;
      layer.setCollisionByProperty({ collides: true });
    });
  }
}
