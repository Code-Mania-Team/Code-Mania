// src/utils/profanityFilter.js

// List of banned words (edit anytime)
const bannedWords = [
  "fuck", "shit", "bitch", "damn", "crap", "piss",
  "dick", "cock", "pussy", "cunt", "whore", "slut",
  "bastard", "motherfucker", "asshole", "ass", "arse",
  "bollocks", "wanker", "twat", "prick", "jackass",
  "douchebag", "scumbag", "dipshit", "bullshit", "horseshit",
  "idiot", "moron", "stupid", "dumb", "retard", "imbecile",
  "fag", "faggot", "dyke", "tranny",
  "nigger", "nigga", "chink", "spic", "kike",
  "wetback", "cracker", "gook", "raghead", "towelhead",
  "rape", "kill yourself", "kys", "die", "murder",
  "putang ina", "putangina", "puta", "gago", "gaga",
  "tangina", "tanginamo", "tarantado", "ulol", "bobo",
  "tanga", "pakyu", "pakyo", "punyeta", "leche",
  "letse", "hinayupak", "hayop", "salot", "lintik",
  "tite", "dicky", "burat", "pwet", "puwet", "pwit",
  "kupal", "supot", "bwisit", "peste", "hudas",
  "siraulo", "inutil", "engot", "ungas", "mangmang",
  "bading", "bayot", "bakla", "tomboy", "negra", "negro",
  "negrito", "instik", "bumbay", "hapon"
];

// Build regex safely from array
const profanityRegex = new RegExp(
  `\\b(${bannedWords.join("|")})\\b`,
  "gi" // g = global, i = case insensitive
);

// Check if text contains profanity
export const containsProfanity = (text = "") => {
  if (!text) return false;
  return profanityRegex.test(text);
};

// Return matched bad words (optional helper)
export const getMatchedProfanity = (text = "") => {
  if (!text) return [];
  const matches = text.match(profanityRegex);
  return matches ? [...new Set(matches.map(w => w.toLowerCase()))] : [];
};

// Censor profanity instead of blocking
export const censorProfanity = (text = "") => {
  if (!text) return text;

  return text.replace(profanityRegex, (match) =>
    "*".repeat(match.length)
  );
};
