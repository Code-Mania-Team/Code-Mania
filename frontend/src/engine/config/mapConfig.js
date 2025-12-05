export const MAPS = {
  map1: {
    mapKey: "map1",
    mapJson: "/assets/maps/map1.json",
    tilesetName: "Tileset - Copy",
    tilesetKey: "Tileset - Copy",
    tilesetImage: "/assets/tilesets/Tileset - Copy.png",
    start: { x: 32, y: 32 },
    nextMap: "map2"
  },

  map2: {
    mapKey: "map2",
    mapJson: "/assets/maps/map2.json",
    tilesetName: "Tileset2",
    tilesetKey: "Tileset2",
    tilesetImage: "/assets/tilesets/Tileset2.png",
    start: { x: 64, y: 64 },
    nextMap: "map3"
  },

  map3: {
    mapKey: "map3",
    mapJson: "/assets/maps/map3.json",
    tilesetName: "Tileset3",
    tilesetKey: "Tileset3",
    tilesetImage: "/assets/tilesets/Tileset3.png",
    start: { x: 128, y: 128 },
    nextMap: null
  }
};
