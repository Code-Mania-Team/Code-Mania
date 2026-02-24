import argon2 from "argon2";

const PEPPER = process.env.PEPPERoni;
console.log("PEPPER loaded:", PEPPER);

if (!PEPPER) {
  throw new Error("PEPPER is not set");
}

export async function hashPassword(password) {
  return argon2.hash(password + PEPPER, {
    type: argon2.argon2id,
    memoryCost: 2 ** 17, // 128 MB
    timeCost: 3,
    parallelism: 2,
  });
}

export async function verifyPassword(hash, password) {
  return argon2.verify(hash, password + PEPPER);
}