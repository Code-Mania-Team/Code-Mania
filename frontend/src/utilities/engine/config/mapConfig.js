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
    }
  },
  JavaScript: {
    map1: {
      mapKey: "js_map1",
      mapJson: "/assets/maps/JavaScript/map1.json",
      tilesets: [
        // tilesets for JS
      ],
      nextMap: "map2"
    }
  },
  Cpp: {
    // ...C++ maps
  }
};
