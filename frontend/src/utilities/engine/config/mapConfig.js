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
  },
    map4: {
      mapKey: "map4",
      mapJson: "/assets/maps/Python/map4.json",
      tilesets: [
        {
          name: "A2",
          key: "A2",
          image: "/assets/tilesets/Python/A2.png"
        },
        {
          name: "ADBTileC_interior",
          key: "ADBTileC_interior",
          image: "/assets/tilesets/Python/ADBTileC_interior.png"
        },
        {
          name: "E_exterior",
          key: "E_exterior",
          image: "/assets/tilesets/Python/E_exterior.png"
        },
        {
          name: "ADBTileA5_interior",
          key: "ADBTileA5_interior",
          image: "/assets/tilesets/Python/ADBTileA5_interior.png"
        },
        {
          name: "commu_church-A4",
          key: "commu_church-A4",
          image: "/assets/tilesets/Python/commu_church-A4.png"
        },
        {
          name: "Dungeon_B_for_mineral",
          key: "Dungeon_B_for_mineral",
          image: "/assets/tilesets/Python/Dungeon_B_for_mineral.png"
        },
        {
          name: "ADBTileB_exterior4",
          key: "ADBTileB_exterior4",
          image: "/assets/tilesets/Python/ADBTileB_exterior4.png"
        }
      ],
      nextMap: "map5" // or "map5" if you add it later
    },
    map5: {
      mapKey: "map5",
      mapJson: "/assets/maps/Python/map5.json",
      tilesets: [
        {
          name: "fsm_C_Inside01_A4",
          key: "fsm_C_Inside01_A4",
          image: "/assets/tilesets/Python/fsm_C_Inside01_A4.png"
        },
        {
          name: "fsm_C_Inside01_A5_1",
          key: "fsm_C_Inside01_A5_1",
          image: "/assets/tilesets/Python/fsm_C_Inside01_A5_1.png"
        },
        {
          name: "fsm_C_Inside01_B1",
          key: "fsm_C_Inside01_B1",
          image: "/assets/tilesets/Python/fsm_C_Inside01_B1.png"
        },
        {
          name: "fsm_C_Inside01_C",
          key: "fsm_C_Inside01_C",
          image: "/assets/tilesets/Python/fsm_C_Inside01_C.png"
        },
        {
          name: "fsm_C_Inside01_D3",
          key: "fsm_C_Inside01_D3",
          image: "/assets/tilesets/Python/fsm_C_Inside01_D3.png"
        },
        {
          name: "Dungeon_B_for_mineral",
          key: "Dungeon_B_for_mineral",
          image: "/assets/tilesets/Python/Dungeon_B_for_mineral.png"
        }
      ],
      nextMap: "map6"
    },
    map6: {
        mapKey: "map6",
        mapJson: "/assets/maps/Python/map6.json",
        tilesets: [
          {
            name: "fsm_C_Inside01_A5_1",
            key: "fsm_C_Inside01_A5_1",
            image: "/assets/tilesets/Python/fsm_C_Inside01_A5_1.png"
          },
          {
            name: "fsm_C_Inside01_B1",
            key: "fsm_C_Inside01_B1",
            image: "/assets/tilesets/Python/fsm_C_Inside01_B1.png"
          },
          {
            name: "fsm_C_Inside01_D2",
            key: "fsm_C_Inside01_D2",
            image: "/assets/tilesets/Python/fsm_C_Inside01_D2.png"
          },
          {
            name: "fsm_C_Inside01_E",
            key: "fsm_C_Inside01_E",
            image: "/assets/tilesets/Python/fsm_C_Inside01_E.png"
          }
        ],
        nextMap: "map7" // matches your trigger target_map
      },
      map7: {
        mapKey: "map7",
        mapJson: "/assets/maps/Python/map7.json",
        tilesets: [
          {
            name: "fsm_C_Inside01_A4",
            key: "fsm_C_Inside01_A4",
            image: "/assets/tilesets/Python/fsm_C_Inside01_A4.png"
          },
          {
            name: "fsm_C_Inside01_A5_1",
            key: "fsm_C_Inside01_A5_1",
            image: "/assets/tilesets/Python/fsm_C_Inside01_A5_1.png"
          },
          {
            name: "fsm_C_Inside01_B1",
            key: "fsm_C_Inside01_B1",
            image: "/assets/tilesets/Python/fsm_C_Inside01_B1.png"
          },
          {
            name: "fsm_C_Inside01_C",
            key: "fsm_C_Inside01_C",
            image: "/assets/tilesets/Python/fsm_C_Inside01_C.png"
          },
          {
            name: "fsm_C_Inside01_D3",
            key: "fsm_C_Inside01_D3",
            image: "/assets/tilesets/Python/fsm_C_Inside01_D3.png"
          },
          {
            name: "Dungeon_B_for_mineral",
            key: "Dungeon_B_for_mineral",
            image: "/assets/tilesets/Python/Dungeon_B_for_mineral.png"
          }
        ],
        nextMap: "map8"
      },
      map8: {
        mapKey: "map8",
        mapJson: "/assets/maps/Python/map8.json",
        tilesets: [
          {
            name: "fsm_C_Inside01_A5_1",
            key: "fsm_C_Inside01_A5_1",
            image: "/assets/tilesets/Python/fsm_C_Inside01_A5_1.png"
          },
          {
            name: "fsm_C_Inside01_B1",
            key: "fsm_C_Inside01_B1",
            image: "/assets/tilesets/Python/fsm_C_Inside01_B1.png"
          },
          {
            name: "fsm_C_Inside01_C",
            key: "fsm_C_Inside01_C",
            image: "/assets/tilesets/Python/fsm_C_Inside01_C.png"
          },
          {
            name: "fsm_C_Inside01_D2",
            key: "fsm_C_Inside01_D2",
            image: "/assets/tilesets/Python/fsm_C_Inside01_D2.png"
          }
        ],
        nextMap: "map9"
      },
      map9: {
        mapKey: "map9",
        mapJson: "/assets/maps/Python/map9.json",
        tilesets: [
          {
            name: "fsm_C_Inside01_A4",
            key: "fsm_C_Inside01_A4",
            image: "/assets/tilesets/Python/fsm_C_Inside01_A4.png"
          },
          {
            name: "fsm_C_Inside01_A5_1",
            key: "fsm_C_Inside01_A5_1",
            image: "/assets/tilesets/Python/fsm_C_Inside01_A5_1.png"
          },
          {
            name: "fsm_C_Inside01_B1",
            key: "fsm_C_Inside01_B1",
            image: "/assets/tilesets/Python/fsm_C_Inside01_B1.png"
          },
          {
            name: "fsm_C_Inside01_C",
            key: "fsm_C_Inside01_C",
            image: "/assets/tilesets/Python/fsm_C_Inside01_C.png"
          },
          {
            name: "fsm_C_Inside01_D3",
            key: "fsm_C_Inside01_D3",
            image: "/assets/tilesets/Python/fsm_C_Inside01_D3.png"
          },
          {
            name: "Dungeon_B_for_mineral",
            key: "Dungeon_B_for_mineral",
            image: "/assets/tilesets/Python/Dungeon_B_for_mineral.png"
          }
        ],
        nextMap: "map10"
      },
      map10: {
        mapKey: "map10",
        mapJson: "/assets/maps/Python/map10.json",
        tilesets: [
          {
            name: "fsm_C_Inside01_A5_1",
            key: "fsm_C_Inside01_A5_1",
            image: "/assets/tilesets/Python/fsm_C_Inside01_A5_1.png"
          },
          {
            name: "fsm_C_Inside01_B1",
            key: "fsm_C_Inside01_B1",
            image: "/assets/tilesets/Python/fsm_C_Inside01_B1.png"
          },
          {
            name: "fsm_C_Inside01_C",
            key: "fsm_C_Inside01_C",
            image: "/assets/tilesets/Python/fsm_C_Inside01_C.png"
          },
          {
            name: "fsm_C_Inside01_D1",
            key: "fsm_C_Inside01_D1",
            image: "/assets/tilesets/Python/fsm_C_Inside01_D1.png"
          }
        ],
        nextMap: "map11"
      },
      map11: {
        mapKey: "map11",
        mapJson: "/assets/maps/Python/map11.json",
        tilesets: [
          {
            name: "fsm_C_Inside01_A4",
            key: "fsm_C_Inside01_A4",
            image: "/assets/tilesets/Python/fsm_C_Inside01_A4.png"
          },
          {
            name: "fsm_C_Inside01_A5_1",
            key: "fsm_C_Inside01_A5_1",
            image: "/assets/tilesets/Python/fsm_C_Inside01_A5_1.png"
          },
          {
            name: "fsm_C_Inside01_B1",
            key: "fsm_C_Inside01_B1",
            image: "/assets/tilesets/Python/fsm_C_Inside01_B1.png"
          },
          {
            name: "fsm_C_Inside01_C",
            key: "fsm_C_Inside01_C",
            image: "/assets/tilesets/Python/fsm_C_Inside01_C.png"
          },
          {
            name: "fsm_C_Inside01_D3",
            key: "fsm_C_Inside01_D3",
            image: "/assets/tilesets/Python/fsm_C_Inside01_D3.png"
          },
          {
            name: "Dungeon_B_for_mineral",
            key: "Dungeon_B_for_mineral",
            image: "/assets/tilesets/Python/Dungeon_B_for_mineral.png"
          }
        ],
        nextMap: "map12"
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
      nextMap: "map5"
    },
    map5: {
      mapKey: "js_map5",
      mapJson: "/assets/maps/JavaScript/js_map5.json",
      tilesets: [
        { name: "Outside_A3.rpgmvp", key: "Outside_A3.rpgmvp", image: "/assets/tilesets/Javascript/Outside_A3.rpgmvp.png" },
        { name: "A1.rpgmvp", key: "A1.rpgmvp", image: "/assets/tilesets/Javascript/A1.rpgmvp.png" },
        { name: "sekaiju1.rpgmvp", key: "sekaiju1.rpgmvp", image: "/assets/tilesets/Javascript/sekaiju1.rpgmvp.png" },
        { name: "bu_Outside_a.rpgmvp", key: "bu_Outside_a.rpgmvp", image: "/assets/tilesets/Javascript/bu_Outside_a.rpgmvp.png" },
        { name: "Outside_A5.rpgmvp", key: "Outside_A5.rpgmvp", image: "/assets/tilesets/Javascript/Outside_A5.rpgmvp.png" },
        { name: "No1-2.rpgmvp", key: "No1-2.rpgmvp", image: "/assets/tilesets/Javascript/No1-2.rpgmvp.png" },
        { name: "No1-3.rpgmvp", key: "No1-3.rpgmvp", image: "/assets/tilesets/Javascript/No1-3.rpgmvp.png" }
      ],
      nextMap: "map6"
    },
    map6: {
      mapKey: "js_map6",
      mapJson: "/assets/maps/JavaScript/js_map6.json",
      tilesets: [
        { name: "A4b.rpgmvp", key: "A4b.rpgmvp", image: "/assets/tilesets/Javascript/A4b.rpgmvp.png" },
        { name: "No1-3.rpgmvp", key: "No1-3.rpgmvp", image: "/assets/tilesets/Javascript/No1-3.rpgmvp.png" },
        { name: "D.rpgmvp", key: "D.rpgmvp", image: "/assets/tilesets/Javascript/D.rpgmvp.png" },
        { name: "A1.rpgmvp", key: "A1.rpgmvp", image: "/assets/tilesets/Javascript/A1.rpgmvp.png" },
        { name: "touhu_02.rpgmvp", key: "touhu_02.rpgmvp", image: "/assets/tilesets/Javascript/touhu_02.rpgmvp.png" }
      ],
      nextMap: "map7"
    },
    map7: {
      mapKey: "js_map7",
      mapJson: "/assets/maps/JavaScript/js_map7.json",
      tilesets: [
        { name: "A4.rpgmvp", key: "A4.rpgmvp", image: "/assets/tilesets/Javascript/A4.rpgmvp.png" },
        { name: "bu_shrine2.rpgmvp", key: "bu_shrine2.rpgmvp", image: "/assets/tilesets/Javascript/bu_shrine2.rpgmvp.png" },
        { name: "bu_Outside2.rpgmvp", key: "bu_Outside2.rpgmvp", image: "/assets/tilesets/Javascript/bu_Outside2.rpgmvp.png" },
        { name: "No1-2a.rpgmvp", key: "No1-2a.rpgmvp", image: "/assets/tilesets/Javascript/No1-2a.rpgmvp.png" },
        { name: "bu_Out_A3.rpgmvp", key: "bu_Out_A3.rpgmvp", image: "/assets/tilesets/Javascript/bu_Out_A3.rpgmvp.png" }
      ],
      nextMap: "map8",
      hasBlockLayers: true
    },
    map8: {
      mapKey: "js_map8",
      mapJson: "/assets/maps/JavaScript/js_map8.json",
      tilesets: [
        { name: "Outside_A3.rpgmvp", key: "Outside_A3.rpgmvp", image: "/assets/tilesets/Javascript/Outside_A3.rpgmvp.png" },
        { name: "A4b.rpgmvp", key: "A4b.rpgmvp", image: "/assets/tilesets/Javascript/A4b.rpgmvp.png" },
        { name: "A2_02.rpgmvp", key: "A2_02.rpgmvp", image: "/assets/tilesets/Javascript/A2_02.rpgmvp.png" },
        { name: "No1-2a.rpgmvp", key: "No1-2a.rpgmvp", image: "/assets/tilesets/Javascript/No1-2a.rpgmvp.png" },
        { name: "No1-2.rpgmvp", key: "No1-2.rpgmvp", image: "/assets/tilesets/Javascript/No1-2.rpgmvp.png" },
        { name: "Outside_B.rpgmvp", key: "Outside_B.rpgmvp", image: "/assets/tilesets/Javascript/Outside_B.rpgmvp.png" },
        { name: "D.rpgmvp", key: "D.rpgmvp", image: "/assets/tilesets/Javascript/D.rpgmvp.png" }
      ],
      nextMap: "map9"
    },
    map9: {
      mapKey: "js_map9",
      mapJson: "/assets/maps/JavaScript/js_map9.json",
      tilesets: [
        { name: "A2_01.rpgmvp", key: "A2_01.rpgmvp", image: "/assets/tilesets/Javascript/A2_01.rpgmvp.png" },
        { name: "sekaiju1.rpgmvp", key: "sekaiju1.rpgmvp", image: "/assets/tilesets/Javascript/sekaiju1.rpgmvp.png" },
        { name: "touhu_01.rpgmvp", key: "touhu_01.rpgmvp", image: "/assets/tilesets/Javascript/touhu_01.rpgmvp.png" },
        { name: "touhu_02.rpgmvp", key: "touhu_02.rpgmvp", image: "/assets/tilesets/Javascript/touhu_02.rpgmvp.png" },
        { name: "bu_Outside_a.rpgmvp", key: "bu_Outside_a.rpgmvp", image: "/assets/tilesets/Javascript/bu_Outside_a.rpgmvp.png" },
        { name: "komyu_01.rpgmvp", key: "komyu_01.rpgmvp", image: "/assets/tilesets/Javascript/komyu_01.rpgmvp.png" },
        { name: "No1-2.rpgmvp", key: "No1-2.rpgmvp", image: "/assets/tilesets/Javascript/No1-2.rpgmvp.png" }
      ],
      nextMap: "map10"
    },
    map10: {
      mapKey: "js_map10",
      mapJson: "/assets/maps/JavaScript/js_map10.json",
      tilesets: [
        { name: "A2_02.rpgmvp", key: "A2_02.rpgmvp", image: "/assets/tilesets/Javascript/A2_02.rpgmvp.png" },
        { name: "No1-2.rpgmvp", key: "No1-2.rpgmvp", image: "/assets/tilesets/Javascript/No1-2.rpgmvp.png" }
      ],
      nextMap: null
    },
    map11: {
      mapKey: "js_map11",
      mapJson: "/assets/maps/JavaScript/js_map11.json",
      tilesets: [
        { name: "A2_01.rpgmvp", key: "A2_01.rpgmvp", image: "/assets/tilesets/Javascript/A2_01.rpgmvp.png" },
        { name: "A1.rpgmvp", key: "A1.rpgmvp", image: "/assets/tilesets/Javascript/A1.rpgmvp.png" },
        { name: "touhu_02.rpgmvp", key: "touhu_02.rpgmvp", image: "/assets/tilesets/Javascript/touhu_02.rpgmvp.png" },
        { name: "bu_Outside.rpgmvp", key: "bu_Outside.rpgmvp", image: "/assets/tilesets/Javascript/bu_Outside.rpgmvp.png" },
        { name: "B.rpgmvp", key: "B.rpgmvp", image: "/assets/tilesets/Javascript/B.rpgmvp.png" },
        { name: "D.rpgmvp", key: "D.rpgmvp", image: "/assets/tilesets/Javascript/D.rpgmvp.png" },
        { name: "No1-3.rpgmvp", key: "No1-3.rpgmvp", image: "/assets/tilesets/Javascript/No1-3.rpgmvp.png" },
        { name: "sekaiju1.rpgmvp", key: "sekaiju1.rpgmvp", image: "/assets/tilesets/Javascript/sekaiju1.rpgmvp.png" },
        { name: "bu_shrine2.rpgmvp", key: "bu_shrine2.rpgmvp", image: "/assets/tilesets/Javascript/bu_shrine2.rpgmvp.png" },
        { name: "No1-2a.rpgmvp", key: "No1-2a.rpgmvp", image: "/assets/tilesets/Javascript/No1-2a.rpgmvp.png" }
      ],
      nextMap: "map12"
    },
    map12: {
      mapKey: "js_map12",
      mapJson: "/assets/maps/JavaScript/js_map12.json",
      tilesets: [
        { name: "A2_01.rpgmvp", key: "A2_01.rpgmvp", image: "/assets/tilesets/Javascript/A2_01.rpgmvp.png" },
        { name: "touhu_01.rpgmvp", key: "touhu_01.rpgmvp", image: "/assets/tilesets/Javascript/touhu_01.rpgmvp.png" },
        { name: "sekaiju1.rpgmvp", key: "sekaiju1.rpgmvp", image: "/assets/tilesets/Javascript/sekaiju1.rpgmvp.png" },
        { name: "B.rpgmvp", key: "B.rpgmvp", image: "/assets/tilesets/Javascript/B.rpgmvp.png" },
        { name: "No1-3.rpgmvp", key: "No1-3.rpgmvp", image: "/assets/tilesets/Javascript/No1-3.rpgmvp.png" },
        { name: "Outside_B.rpgmvp", key: "Outside_B.rpgmvp", image: "/assets/tilesets/Javascript/Outside_B.rpgmvp.png" }
      ],
      nextMap: null
    },
    map13: {
      mapKey: "js_map13",
      mapJson: "/assets/maps/JavaScript/js_map13.json",
      tilesets: [
        { name: "A2_01.rpgmvp", key: "A2_01.rpgmvp", image: "/assets/tilesets/Javascript/A2_01.rpgmvp.png" },
        { name: "touhu_01.rpgmvp", key: "touhu_01.rpgmvp", image: "/assets/tilesets/Javascript/touhu_01.rpgmvp.png" },
        { name: "sekaiju1.rpgmvp", key: "sekaiju1.rpgmvp", image: "/assets/tilesets/Javascript/sekaiju1.rpgmvp.png" },
        { name: "B.rpgmvp", key: "B.rpgmvp", image: "/assets/tilesets/Javascript/B.rpgmvp.png" },
        { name: "No1-3.rpgmvp", key: "No1-3.rpgmvp", image: "/assets/tilesets/Javascript/No1-3.rpgmvp.png" },
        { name: "Outside_B.rpgmvp", key: "Outside_B.rpgmvp", image: "/assets/tilesets/Javascript/Outside_B.rpgmvp.png" }
      ],
      nextMap: "map14"
    },
    map14: {
      mapKey: "js_map14",
      mapJson: "/assets/maps/JavaScript/js_map14.json",
      tilesets: [
        { name: "A2_01.rpgmvp", key: "A2_01.rpgmvp", image: "/assets/tilesets/Javascript/A2_01.rpgmvp.png" },
        { name: "touhu_01.rpgmvp", key: "touhu_01.rpgmvp", image: "/assets/tilesets/Javascript/touhu_01.rpgmvp.png" },
        { name: "sekaiju1.rpgmvp", key: "sekaiju1.rpgmvp", image: "/assets/tilesets/Javascript/sekaiju1.rpgmvp.png" },
        { name: "B.rpgmvp", key: "B.rpgmvp", image: "/assets/tilesets/Javascript/B.rpgmvp.png" },
        { name: "No1-3.rpgmvp", key: "No1-3.rpgmvp", image: "/assets/tilesets/Javascript/No1-3.rpgmvp.png" },
        { name: "Outside_B.rpgmvp", key: "Outside_B.rpgmvp", image: "/assets/tilesets/Javascript/Outside_B.rpgmvp.png" }
      ],
      nextMap: "map15"
    },
    map15: {
      mapKey: "js_map15",
      mapJson: "/assets/maps/JavaScript/js_map15.json",
      tilesets: [
        { name: "A2_01.rpgmvp", key: "A2_01.rpgmvp", image: "/assets/tilesets/Javascript/A2_01.rpgmvp.png" },
        { name: "touhu_01.rpgmvp", key: "touhu_01.rpgmvp", image: "/assets/tilesets/Javascript/touhu_01.rpgmvp.png" },
        { name: "sekaiju1.rpgmvp", key: "sekaiju1.rpgmvp", image: "/assets/tilesets/Javascript/sekaiju1.rpgmvp.png" },
        { name: "B.rpgmvp", key: "B.rpgmvp", image: "/assets/tilesets/Javascript/B.rpgmvp.png" },
        { name: "No1-3.rpgmvp", key: "No1-3.rpgmvp", image: "/assets/tilesets/Javascript/No1-3.rpgmvp.png" },
        { name: "Outside_B.rpgmvp", key: "Outside_B.rpgmvp", image: "/assets/tilesets/Javascript/Outside_B.rpgmvp.png" }
      ],
      nextMap: "map16"
    },
    map16: {
      mapKey: "js_map16",
      mapJson: "/assets/maps/JavaScript/js_map16.json",
      tilesets: [
        { name: "A2_01.rpgmvp", key: "A2_01.rpgmvp", image: "/assets/tilesets/Javascript/A2_01.rpgmvp.png" },
        { name: "touhu_01.rpgmvp", key: "touhu_01.rpgmvp", image: "/assets/tilesets/Javascript/touhu_01.rpgmvp.png" },
        { name: "sekaiju1.rpgmvp", key: "sekaiju1.rpgmvp", image: "/assets/tilesets/Javascript/sekaiju1.rpgmvp.png" },
        { name: "B.rpgmvp", key: "B.rpgmvp", image: "/assets/tilesets/Javascript/B.rpgmvp.png" },
        { name: "No1-3.rpgmvp", key: "No1-3.rpgmvp", image: "/assets/tilesets/Javascript/No1-3.rpgmvp.png" },
        { name: "Outside_B.rpgmvp", key: "Outside_B.rpgmvp", image: "/assets/tilesets/Javascript/Outside_B.rpgmvp.png" }
      ],
      nextMap: null
    },
  },
  Cpp: {
    // ...C++ maps
    map1: {
      mapKey: "cpp_map1",
      mapJson: "/assets/maps/Cpp/cpp_map1.json",
      tilesets: [
        { name: "bougainvillea_mapchip_mv4", key: "bougainvillea_mapchip_mv4", image: "/assets/tilesets/Cpp/bougainvillea_mapchip_mv4.png" },
        { name: "commu_floor", key: "commu_floor", image: "/assets/tilesets/Cpp/commu_floor.png" },
        { name: "pika_nos_tiles02_B", key: "pika_nos_tiles02_B", image: "/assets/tilesets/Cpp/pika_nos_tiles02_B.png" },
        { name: "Tile", key: "ModernCity_A2", image: "/assets/tilesets/Cpp/ModernCity_A2.png" },
        { name: "ModernCity_B", key: "ModernCity_B", image: "/assets/tilesets/Cpp/ModernCity_B.png" },
        { name: "pika_nos_tiles02_A5", key: "pika_nos_tiles02_A5", image: "/assets/tilesets/Cpp/pika_nos_tiles02_A5.png" },
        { name: "FutsuCity_A3", key: "FutsuCity_A3", image: "/assets/tilesets/Cpp/FutsuCity_A3.png" },
        { name: "FutsuCity_B", key: "FutsuCity_B", image: "/assets/tilesets/Cpp/FutsuCity_B.png" },
        { name: "FutsuCity_C", key: "FutsuCity_C", image: "/assets/tilesets/Cpp/FutsuCity_C.png" },
        { name: "ModernCity_A3", key: "ModernCity_A3", image: "/assets/tilesets/Cpp/ModernCity_A3.png" },
        { name: "ModernCity_A4", key: "ModernCity_A4", image: "/assets/tilesets/Cpp/ModernCity_A4.png" },
        { name: "MordernOuter_Houses", key: "MordernOuter_Houses", image: "/assets/tilesets/Cpp/MordernOuter_Houses.png" },
        { name: "MordernOuter_Outdoor", key: "MordernOuter_Outdoor", image: "/assets/tilesets/Cpp/MordernOuter_Outdoor.png" },
        { name: "MordernOuter_Outside_A5", key: "MordernOuter_Outside_A5", image: "/assets/tilesets/Cpp/MordernOuter_Outside_A5.png" },
        { name: "bougainvillea_mapchip_mv16", key: "bougainvillea_mapchip_mv16", image: "/assets/tilesets/Cpp/bougainvillea_mapchip_mv16.png" },
        { name: "ModernCity_C", key: "ModernCity_C", image: "/assets/tilesets/Cpp/ModernCity_C.png" },
        { name: "pika_nos_in_tiles01_D", key: "pika_nos_in_tiles01_D", image: "/assets/tilesets/Cpp/pika_nos_in_tiles01_D.png" },
        { name: "pika_nos_in_tiles01_A2", key: "pika_nos_in_tiles01_A2", image: "/assets/tilesets/Cpp/pika_nos_in_tiles01_A2.png" },
        { name: "ModernCity_A5", key: "ModernCity_A5", image: "/assets/tilesets/Cpp/ModernCity_A5.png" }
      ],
      nextMap: "map2"
    },
    map2: {
      mapKey: "cpp_map2",
      mapJson: "/assets/maps/Cpp/cpp_map2.json",
      tilesets: [
        { name: "pika_nos_tiles02_B", key: "pika_nos_tiles02_B", image: "/assets/tilesets/Cpp/BlackCom_Inside_B.png" },
        { name: "ModernCity_A5", key: "ModernCity_A5", image: "/assets/tilesets/Cpp/ModernCity_A5.png" },
        { name: "SP_Inside_A5", key: "SP_Inside_A5", image: "/assets/tilesets/Cpp/SP_Inside_A5.png" },
        { name: "ModernCity_A4_Night", key: "ModernCity_A4_Night", image: "/assets/tilesets/Cpp/ModernCity_A4_Night.png" },
        { name: "cyber_W", key: "cyber_W", image: "/assets/tilesets/Cpp/cyber_W.png" },
        { name: "SP_Outside_D2", key: "SP_Outside_D2", image: "/assets/tilesets/Cpp/SP_Outside_D2.png" },
        { name: "FutsuCity_A4h", key: "FutsuCity_A4h", image: "/assets/tilesets/Cpp/FutsuCity_A4h.png" },
        { name: "pika_nos_in_tiles01_D", key: "pika_nos_in_tiles01_D", image: "/assets/tilesets/Cpp/pika_nos_in_tiles01_D.png" },
        { name: "FutsuCity_C", key: "FutsuCity_C", image: "/assets/tilesets/Cpp/FutsuCity_C.png" },
        { name: "ModernCity_B", key: "ModernCity_B", image: "/assets/tilesets/Cpp/ModernCity_B.png" }
      ],
      nextMap: "map3"
    },
    map3: {
      mapKey: "cpp_map3",
      mapJson: "/assets/maps/Cpp/cpp_map3.json",
      tilesets: [
        {
          name: "pika_nos_in_tiles01_A5_2",
          key: "pika_nos_in_tiles01_A5_2",
          image: "/assets/tilesets/Cpp/pika_nos_in_tiles01_A5_2.png"
        },
        {
          name: "pika_nos_tiles02_B",
          key: "pika_nos_tiles02_B",
          image: "/assets/tilesets/Cpp/pika_nos_tiles02_B.png"
        },
        {
          name: "MordernOuter_Outdoor",
          key: "MordernOuter_Outdoor",
          image: "/assets/tilesets/Cpp/MordernOuter_Outdoor.png"
        },
        {
          name: "NightClub_A2",
          key: "NightClub_A2",
          image: "/assets/tilesets/Cpp/NightClub_A2.png"
        },
        {
          name: "Commu-ditie3",
          key: "Commu-ditie3",
          image: "/assets/tilesets/Python/Commu-ditie3.png"
        }
      ],
      nextMap: "map4"
    },
    map4: {
      mapKey: "cpp_map4",
      mapJson: "/assets/maps/Cpp/cpp_map4.json",
      tilesets: [
        { name: "pika_nos_in_tiles01_A5_2", key: "pika_nos_in_tiles01_A5_2", image: "/assets/tilesets/Cpp/pika_nos_in_tiles01_A5_2.png" },
        { name: "Commu-ditie1", key: "Commu-ditie1", image: "/assets/tilesets/Python/Commu-ditie1.png" },
        { name: "pika_nos_tiles02_B", key: "pika_nos_tiles02_B", image: "/assets/tilesets/Cpp/pika_nos_tiles02_B.png" },
        { name: "MordernOuter_TileA4", key: "MordernOuter_TileA4", image: "/assets/tilesets/Cpp/MordernOuter_TileA4.png" },
        { name: "univ_wall", key: "univ_wall", image: "/assets/tilesets/Cpp/univ_wall.png" },
        { name: "MordernOuter_Outdoor", key: "MordernOuter_Outdoor", image: "/assets/tilesets/Cpp/MordernOuter_Outdoor.png" },
        { name: "BlackCom_Inside_B", key: "BlackCom_Inside_B", image: "/assets/tilesets/Cpp/BlackCom_Inside_B.png" }
      ],
      nextMap: "map5"
    },
    map5: {
      mapKey: "cpp_map5",
      mapJson: "/assets/maps/Cpp/cpp_map5.json",
      tilesets: [
        {
          name: "commu_law03",
          key: "commu_law03",
          image: "/assets/tilesets/Cpp/commu_law03.png"
        },
        {
          name: "pika_nos_tiles02_B",
          key: "pika_nos_tiles02_B",
          image: "/assets/tilesets/Cpp/pika_nos_tiles02_B.png"
        },
        {
          name: "pika_nos_in_tiles01_A5_1",
          key: "pika_nos_in_tiles01_A5_1",
          image: "/assets/tilesets/Cpp/pika_nos_in_tiles01_A5_1.png"
        },
        {
          name: "univ_wall",
          key: "univ_wall",
          image: "/assets/tilesets/Cpp/univ_wall.png"
        },
        {
          name: "commu_libraryfloor",
          key: "commu_libraryfloor",
          image: "/assets/tilesets/Cpp/commu_libraryfloor.png"
        },
        {
          name: "ModernCity_A2",
          key: "ModernCity_A2",
          image: "/assets/tilesets/Cpp/ModernCity_A2.png"
        },
        {
          name: "ModernCity_A5",
          key: "ModernCity_A5",
          image: "/assets/tilesets/Cpp/ModernCity_A5.png"
        },
        {
          name: "commu_law01",
          key: "commu_law01",
          image: "/assets/tilesets/Cpp/commu_law01.png"
        },
        {
          name: "cyber_B",
          key: "cyber_B",
          image: "/assets/tilesets/Cpp/cyber_B.png"
        },
        {
          name: "commu_picture",
          key: "commu_picture",
          image: "/assets/tilesets/Cpp/commu_picture.png"
        },
        {
          name: "MordernOuter_Suburbs",
          key: "MordernOuter_Suburbs",
          image: "/assets/tilesets/Cpp/MordernOuter_Suburbs.png"
        },
        {
          name: "SP_Inside_A2",
          key: "SP_Inside_A2",
          image: "/assets/tilesets/Cpp/SP_Inside_A2.png"
        },
        {
          name: "SP_Inside_A5",
          key: "SP_Inside_A5",
          image: "/assets/tilesets/Cpp/SP_Inside_A5.png"
        },
        {
          name: "pika_nos_tiles02_C",
          key: "pika_nos_tiles02_C",
          image: "/assets/tilesets/Cpp/pika_nos_tiles02_C.png"
        }
      ],
      nextMap: null
    }
  }
}