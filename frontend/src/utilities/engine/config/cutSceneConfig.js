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
        "Every river flowed with data.",
      ],
    },
    { type: "cameraMove", x: 600, y: 500, duration: 2500 },
    {
      type: "dialogue",
      lines: [
        "But after the Great Runtime Crash...",
        "The code fractured.",
        "Bugs crawled into the land, and errors became law.",
      ],
    },
    { type: "cameraMove", x: 400, y: 700, duration: 2000 },
    {
      type: "dialogue",
      lines: [
        "You were once its greatest coder.",
        "Now, your memory lies scattered across this world.",
        "To restore Codemania...",
        "You must first restore yourself.",
      ],
    },
    { type: "cameraFollowPlayer" },
    { type: "unlockPlayer" },
  ],

  JavaScript_map1_intro: [
    { type: "lockPlayer" },
    { type: "fadeIn", duration: 2000 },
    {
      type: "dialogue",
      lines: ["Where am I?", "This place...", "It's too quiet."],
    },
    {
      type: "dialogue",
      lines: [
        "...",
        "Did I come here on purpose?",
        "Or did I just... end up here?",
      ],
    },
    { type: "cameraMove", x: 520, y: 460, duration: 3000 },
    {
      type: "dialogue",
      lines: [
        "The lights seem broken...",
        "The houses are open.",
        "But it's abandoned.",
      ],
    },
    { type: "cameraMove", x: 480, y: 620, duration: 2500 },
    {
      type: "dialogue",
      lines: [
        "I feel like I've walked these streets before.",
        "I know it...",
        "I just don't know when.",
      ],
    },
    {
      type: "dialogue",
      lines: [
        "Nothing crashes here.",
        "Nothing breaks.",
        "Things just stop working...",
      ],
    },
    {
      type: "dialogue",
      lines: [
        "Is this town waiting for me?",
        "Or am I waiting for it to remember?",
      ],
    },
    { type: "cameraFollowPlayer" },
    { type: "unlockPlayer" },
  ],

  Cpp_map1_intro: [
    { type: "lockPlayer" },

    { type: "cameraMove", x: 760, y: 380, duration: 3000 },
    {
      type: "dialogue",
      lines: [
        "This city feels... solid.",
        "Like every structure was placed with intention.",
        "Nothing accidental.",
      ],
    },

    { type: "cameraMove", x: 600, y: 420, duration: 2800 },
    {
      type: "dialogue",
      lines: [
        "Tall buildings.",
        "Clean edges.",
        "Clear paths from one place to another.",
      ],
    },

    {
      type: "dialogue",
      lines: [
        "Nothing moves unless it's told to.",
        "Nothing exists unless it’s defined first.",
      ],
    },

    { type: "cameraMove", x: 520, y: 560, duration: 2500 },
    {
      type: "dialogue",
      lines: [
        "I think I understand this place.",
        "The city doesn’t guess.",
        "It only does exactly what it’s instructed to do.",
      ],
    },

    {
      type: "dialogue",
      lines: [
        "If something breaks here…",
        "It’s not chaos.",
        "It’s a missing instruction.",
      ],
    },

    {
      type: "dialogue",
      lines: [
        "If I build something in this city...",
        "It will stay built.",
        "As long as I take responsibility for every part of it.",
      ],
    },

    {
      type: "dialogue",
      lines: ["No shortcuts.", "No assumptions.", "Just clear rules."],
    },

    {
      type: "dialogue",
      lines: [
        "Alright.",
        "Let’s start from the foundation.",
        "Every system begins somewhere.",
      ],
    },

    { type: "cameraFollowPlayer" },
    { type: "unlockPlayer" },
  ],
};
