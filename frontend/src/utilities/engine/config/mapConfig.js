export const MAPS = {
  Python: {
    map1: {
      mapKey: "map1",
      mapJson: "/assets/maps/Python/map1.json",
      tilesets: [
        { name: "A1", key: "A1", image: "/assets/tilesets/Python/A1.png" },
        { name: "A2", key: "A2", image: "/assets/tilesets/Python/A2.png" },
        { name: "B_4", key: "B_4", image: "/assets/tilesets/Python/B_4.png" },
        { name: "A5_4", key: "A5_4", image: "/assets/tilesets/Python/A5_4.png" },
        { name: "C", key: "C", image: "/assets/tilesets/Python/C.png" }
      ],
      nextMap: "map2"
    },
    map2: {
      mapKey: "map2",
      mapJson: "/assets/maps/Python/map2.json",
      tilesets: [
        { name: "ADBTileA2_exterior", key: "A2", image: "/assets/tilesets/Python/ADBTileA2_exterior.png" },
        { name: "ADBTileB_exterior4", key: "B4", image: "/assets/tilesets/Python/ADBTileB_exterior4.png" },
        { name: "Dungeon_hc_B", key: "Dungeon", image: "/assets/tilesets/Python/Dungeon_hc_B.png" },
        { name: "!fsm_chest01", key: "Chest", image: "/assets/tilesets/Python/!fsm_chest01.png" }
      ],
      nextMap: "map3"
    },
    map3: {
    mapKey: "map3",
    mapJson: "/assets/maps/Python/map3.json",
    tilesets: [
      {
        name: "ADBTileB_exterior4",
        key: "ADBTileB_exterior4",
        image: "/assets/tilesets/Python/ADBTileB_exterior4.png"
      },
      {
        name: "A2",
        key: "A2",
        image: "/assets/tilesets/Python/A2.png"
      },
      {
        name: "D_2",
        key: "D_2",
        image: "/assets/tilesets/Python/D_2.png"
      },
      {
        name: "Inside_A2",
        key: "Inside_A2",
        image: "/assets/tilesets/Python/Inside_A2.png"
      },
      {
        name: "pika_nos_tiles01_C",
        key: "pika_nos_tiles01_C",
        image: "/assets/tilesets/Python/pika_nos_tiles01_C.png"
      },
      {
        name: "ADBTileD_exterior2",
        key: "ADBTileD_exterior2",
        image: "/assets/tilesets/Python/ADBTileD_exterior2.png"
      }
    ],
    nextMap: "map4" // matches your trigger target_map
  }


  },
  JavaScript: {
    map1: {
      mapKey: "js_map1",
      mapJson: "/assets/maps/JavaScript/js_map1.json",
      tilesets: [
        { name: "Outside_A2.rpgmvp", key: "Outside_A2.rpgmvp", image: "/assets/tilesets/Javascript/Outside_A2.rpgmvp.png" },
        { name: "Outside_A1.rpgmvp", key: "Outside_A1.rpgmvp", image: "/assets/tilesets/Javascript/Outside_A1.rpgmvp.png" },
        { name: "c.rpgmvp", key: "c.rpgmvp", image: "/assets/tilesets/Javascript/c.rpgmvp.png" },
        { name: "sekaiju1.rpgmvp", key: "sekaiju1.rpgmvp", image: "/assets/tilesets/Javascript/sekaiju1.rpgmvp.png" },
        { name: "bu_shrine2.rpgmvp", key: "bu_shrine2.rpgmvp", image: "/assets/tilesets/Javascript/bu_shrine2.rpgmvp.png" },
        { name: "A2_01.rpgmvp", key: "A2_01.rpgmvp", image: "/assets/tilesets/Javascript/A2_01.rpgmvp.png" },
        { name: "fsm_Forest01_A1.rpgmvp", key: "fsm_Forest01_A1.rpgmvp", image: "/assets/tilesets/Javascript/fsm_Forest01_A1.rpgmvp.png" },
        { name: "bu_Outside2.rpgmvp", key: "bu_Outside2.rpgmvp", image: "/assets/tilesets/Javascript/bu_Outside2.rpgmvp.png" }
      ],
      nextMap: "map2"
    },
    map2: {
      mapKey: "js_map2",
      mapJson: "/assets/maps/JavaScript/js_map2.json",
      tilesets: [
        { name: "Outside_A2.rpgmvp", key: "Outside_A2.rpgmvp", image: "/assets/tilesets/Javascript/Outside_A2.rpgmvp.png" },
        { name: "touhu_02.rpgmvp", key: "touhu_02.rpgmvp", image: "/assets/tilesets/Javascript/touhu_02.rpgmvp.png" },
        { name: "Outside_C.rpgmvp", key: "Outside_C.rpgmvp", image: "/assets/tilesets/Javascript/Outside_C.rpgmvp.png" },
        { name: "touhu_01.rpgmvp", key: "touhu_01.rpgmvp", image: "/assets/tilesets/Javascript/touhu_01.rpgmvp.png" },
        { name: "bu_Outside.rpgmvp", key: "bu_Outside.rpgmvp", image: "/assets/tilesets/Javascript/bu_Outside.rpgmvp.png" },
        { name: "D.rpgmvp", key: "D.rpgmvp", image: "/assets/tilesets/Javascript/D.rpgmvp.png" },
        { name: "bu_Outside2.rpgmvp", key: "bu_Outside2.rpgmvp", image: "/assets/tilesets/Javascript/bu_Outside2.rpgmvp.png" },
        { name: "c.rpgmvp", key: "c.rpgmvp", image: "/assets/tilesets/Javascript/c.rpgmvp.png" },
        { name: "bu_shrine1.rpgmvp", key: "bu_shrine1.rpgmvp", image: "/assets/tilesets/Javascript/bu_shrine1.rpgmvp.png" }
      ],
      nextMap: "map3"
    },
    map3: {
      mapKey: "js_map3",
      mapJson: "/assets/maps/JavaScript/js_map3.json",
      tilesets: [
        { name: "Outside_A2.rpgmvp", key: "Outside_A2.rpgmvp", image: "/assets/tilesets/Javascript/Outside_A2.rpgmvp.png" },
        { name: "No1-3.rpgmvp", key: "No1-3.rpgmvp", image: "/assets/tilesets/Javascript/No1-3.rpgmvp.png" },
        { name: "A1.rpgmvp", key: "A1.rpgmvp", image: "/assets/tilesets/Javascript/A1.rpgmvp.png" },
        { name: "bu_Outside.rpgmvp", key: "bu_Outside.rpgmvp", image: "/assets/tilesets/Javascript/bu_Outside.rpgmvp.png" },
        { name: "D_Exterior1", key: "D_Exterior1", image: "/assets/tilesets/Python/D_Exterior1.png" },
        { name: "Outside_B.rpgmvp", key: "Outside_B.rpgmvp", image: "/assets/tilesets/Javascript/Outside_B.rpgmvp.png" },
        { name: "B.rpgmvp", key: "B.rpgmvp", image: "/assets/tilesets/Javascript/B.rpgmvp.png" },
        { name: "No1-2.rpgmvp", key: "No1-2.rpgmvp", image: "/assets/tilesets/Javascript/No1-2.rpgmvp.png" },
        { name: "D.rpgmvp", key: "D.rpgmvp", image: "/assets/tilesets/Javascript/D.rpgmvp.png" }
      ],
      nextMap: "map4"
    },
    map4: {
      mapKey: "js_map4",
      mapJson: "/assets/maps/JavaScript/js_map4.json",
      tilesets: [
        { name: "Outside_A2.rpgmvp", key: "Outside_A2.rpgmvp", image: "/assets/tilesets/Javascript/Outside_A2.rpgmvp.png" },
        { name: "A4.rpgmvp", key: "A4.rpgmvp", image: "/assets/tilesets/Javascript/A4.rpgmvp.png" },
        { name: "komyu_01.rpgmvp", key: "komyu_01.rpgmvp", image: "/assets/tilesets/Javascript/komyu_01.rpgmvp.png" },
        { name: "No1-3.rpgmvp", key: "No1-3.rpgmvp", image: "/assets/tilesets/Javascript/No1-3.rpgmvp.png" },
        { name: "bu_Outside_a.rpgmvp", key: "bu_Outside_a.rpgmvp", image: "/assets/tilesets/Javascript/bu_Outside_a.rpgmvp.png" },
        { name: "A1b.rpgmvp", key: "A1b.rpgmvp", image: "/assets/tilesets/Javascript/A1b.rpgmvp.png" },
        { name: "touhu_01.rpgmvp", key: "touhu_01.rpgmvp", image: "/assets/tilesets/Javascript/touhu_01.rpgmvp.png" },
        { name: "B.rpgmvp", key: "B.rpgmvp", image: "/assets/tilesets/Javascript/B.rpgmvp.png" },
        { name: "bu_Outside2.rpgmvp", key: "bu_Outside2.rpgmvp", image: "/assets/tilesets/Javascript/bu_Outside2.rpgmvp.png" },
        { name: "No1-2a.rpgmvp", key: "No1-2a.rpgmvp", image: "/assets/tilesets/Javascript/No1-2a.rpgmvp.png" },
        { name: "No1-2.rpgmvp", key: "No1-2.rpgmvp", image: "/assets/tilesets/Javascript/No1-2.rpgmvp.png" }
      ],
      nextMap: null
    }
  },
  Cpp: {
    // ...C++ maps
  }
};
