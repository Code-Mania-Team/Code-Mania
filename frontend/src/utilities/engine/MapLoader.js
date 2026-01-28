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

      // 🔥 COLLISION BY TILE PROPERTY
      layer.setCollisionByProperty({ collision: true });

      // 🧠 DEPTH RULES
      const name = layerData.name.toLowerCase();

      if (name.includes("foreground") || name.includes("deco_up")) {
        layer.setDepth(200); // ALWAYS ABOVE PLAYER
      } else {
        layer.setDepth(0); // BELOW PLAYER
      }

      this.layers[layerData.name] = layer;

      if (
        layer.layer.data.some(row =>
          row.some(tile => tile?.properties?.collision)
        )
      ) {
        this.collisionLayers.push(layer);
      }
    });
  }
}
