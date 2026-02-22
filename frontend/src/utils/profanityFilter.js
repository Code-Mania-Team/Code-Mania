// src/utils/profanityFilter.js

// List of banned words (edit anytime)
const bannedWords = [
  "fuck",
  "shit",
  "bitch",
  "damn",
  "crap",
  "piss",
  "dick",
  "cock",
  "pussy",
  "cunt",
  "whore",
  "slut",
  "bastard",
  "motherfucker",
  "idiot",
  "moron",
  "stupid",
  "dumb",
  "retard",
  "fag",
  "nigger",
  "nigga",
  "chink",
  "spic",
  "rape",
];

// Build regex safely from array
const profanityRegex = new RegExp(
  `\\b(${bannedWords.join("|")})\\b`,
  "gi", // g = global, i = case insensitive
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
  return matches ? [...new Set(matches.map((w) => w.toLowerCase()))] : [];
};

// Censor profanity instead of blocking
export const censorProfanity = (text = "") => {
  if (!text) return text;

  return text.replace(profanityRegex, (match) => "*".repeat(match.length));
};
