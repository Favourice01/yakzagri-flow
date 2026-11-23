import { request } from "./client";
import type { ReputationResponse } from "./types";

/** Reputation responses are reused for five minutes to cut repeat calls (#407). */
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  value: ReputationResponse;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

async function cachedRequest(key: string, load: () => Promise<ReputationResponse>): Promise<ReputationResponse> {
  const hit = cache.get(key);
  if (hit && Date.now() < hit.expiresAt) return hit.value;

  const value = await load();
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

/**
 * Drop cached reputation data. Pass an address to clear that user's entry,
 * or nothing to clear everything. Own-reputation entries are always cleared,
 * since a settled trade changes the caller's score too.
 */
export function invalidateReputationCache(address?: string): void {
  for (const key of Array.from(cache.keys())) {
    if (address === undefined || key === `user:${address}` || key.startsWith("me:")) {
      cache.delete(key);
    }
  }
}

export const reputationApi = {
  getMyReputation: (token: string) =>
    cachedRequest(`me:${token}`, () =>
      request<ReputationResponse>("/users/me/reputation", { token }),
    ),

  getUserReputation: (address: string) =>
    cachedRequest(`user:${address}`, () =>
      request<ReputationResponse>(`/users/${address}/reputation`),
    ),
};

export const NEW_PARTICIPANT_LABEL = "Unrated / New";
export const NEW_PARTICIPANT_DESCRIPTION = "New Participant (No trade history yet)";
export const NEW_PARTICIPANT_TOOLTIP =
  "Complete your first trade to establish your trust score. Settle trades on time and avoid disputes to build trust.";

export interface ReputationSummary {
  isNewParticipant: boolean;
  /** Finite trust score clamped to 0-100 (0 for new participants). */
  trustScore: number;
  /** Finite success rate clamped to 0-100 (0 for new participants). */
  successRate: number;
  /** Score on the 0-5 scale used by the score ring. */
  ringScore: number;
  /** Human-readable score, e.g. "72" or "Unrated / New". */
  scoreLabel: string;
  tooltip: string | null;
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Derives display-safe reputation values. Users with zero trades have no
 * meaningful score, so they get a designated "new participant" state rather
 * than NaN produced by dividing by a zero trade count.
 */
export function summarizeReputation(rep: ReputationResponse): ReputationSummary {
  const totalTrades = finiteOr(rep.totalTrades, 0);
  const completedTrades = finiteOr(rep.completedTrades, 0);

  if (totalTrades <= 0 && completedTrades <= 0) {
    return {
      isNewParticipant: true,
      trustScore: 0,
      successRate: 0,
      ringScore: 0,
      scoreLabel: NEW_PARTICIPANT_LABEL,
      tooltip: NEW_PARTICIPANT_TOOLTIP,
    };
  }

  const trustScore = Math.min(100, Math.max(0, finiteOr(rep.trustScore, 0)));
  const successRate = Math.min(100, Math.max(0, finiteOr(rep.successRate, 0)));
  return {
    isNewParticipant: false,
    trustScore,
    successRate,
    ringScore: (trustScore / 100) * 5,
    scoreLabel: String(trustScore),
    tooltip: null,
  };
}
