import bcrypt from "bcryptjs";

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);

export async function hash(s: string, rounds = ROUNDS): Promise<string> {
  return bcrypt.hash(s, rounds);
}

export async function compare(s: string, hash: string): Promise<boolean> {
  return bcrypt.compare(s, hash);
}
