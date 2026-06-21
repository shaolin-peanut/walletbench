import type { Challenge } from "./types";
import { challenges } from "../data/challenges";

export function getChallenge(id: string): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}

export function listChallenges(): Challenge[] {
  return [...challenges];
}

export function getChallengePack(packName: string): Challenge[] {
  // The AI Ops pack contains all 6 challenges.
  // No pack field exists on Challenge (§10.1 exact fields), so we map by convention.
  if (packName.toLowerCase() === "ai-ops" || packName.toLowerCase() === "ai-ops-pack") {
    return [...challenges];
  }
  return [];
}
