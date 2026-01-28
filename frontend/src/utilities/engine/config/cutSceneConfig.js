export const CUTSCENES = {
  Python_map1_intro: [
    { type: "lockPlayer" },
    { type: "cameraMove", x: 900, y: 250, duration: 3000 },
    {
      type: "dialogue",
      lines: [
        "This is Codemania.",
        "A land once shaped by logic, order, and clean syntax.",
        "Every mountain was an algorithm.",
        "Every river flowed with data."
      ]
    },
    { type: "cameraMove", x: 600, y: 500, duration: 2500 },
    {
      type: "dialogue",
      lines: [
        "But after the Great Runtime Crash...",
        "The code fractured.",
        "Bugs crawled into the land, and errors became law."
      ]
    },
    { type: "cameraMove", x: 400, y: 700, duration: 2000 },
    {
      type: "dialogue",
      lines: [
        "You were once its greatest coder.",
        "Now, your memory lies scattered across this world.",
        "To restore Codemania...",
        "You must first restore yourself."
      ]
    },
    { type: "cameraFollowPlayer" },
    { type: "unlockPlayer" }
  ],

  JavaScript_map1_intro: [
],

  Cpp_map1_intro: [
    // ...C++ version of map1 cutscene
  ]
};
