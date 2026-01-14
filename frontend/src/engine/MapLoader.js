export default class MapLoader {
  constructor(scene) {
    this.scene = scene;
    this.map = null;
    this.layers = {};
    this.tilesets = [];
    this.collisionLayers = [];
  }

  load(mapKey, mapJsonPath, tilesets) {
    this.scene.load.tilemapTiledJSON(mapKey, mapJsonPath);

    tilesets.forEach(ts => {
      this.scene.load.image(ts.key, ts.image);
    });
  }

  create(mapKey, tilesets) {
    this.map = this.scene.make.tilemap({ key: mapKey });

    this.tilesets = tilesets.map(ts =>
      this.map.addTilesetImage(ts.name, ts.key)
    );

    this.map.layers.forEach(layerData => {
      const layer = this.map.createLayer(
        layerData.name,
        this.tilesets,
        0,
        0
      );

      // 🔥 AUTO COLLISION BASED ON TILE PROPERTY
      layer.setCollisionByProperty({ collision: true });

      this.layers[layerData.name] = layer;

      // Track layers that actually have collision
      if (layer.layer.data.some(row =>
        row.some(tile => tile?.properties?.collision)
      )) {
        this.collisionLayers.push(layer);
      }
    });
  }
}
