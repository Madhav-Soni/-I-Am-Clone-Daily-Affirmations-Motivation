'use strict';

/**
 * statsCache.js
 *
 * Lightweight in-memory TTL cache for per-user stats aggregation.
 * Eliminates redundant MongoDB aggregation on every cold start / mount.
 *
 * Invalidated explicitly on:
 *   - affirmation generation (affirmationController.js)
 *   - mood log submission   (moodController.js)
 *
 * TTL: 5 minutes (matches recommended client-side staleTime).
 * No external dependencies required.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes

/** @type {Map<string, { data: object, expiresAt: number }>} */
const cache = new Map();

/**
 * Get cached stats for a user.
 * Returns null if missing or expired.
 * @param {string} userId
 * @returns {object|null}
 */
function getStats(userId) {
  const entry = cache.get(String(userId));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(String(userId));
    return null;
  }
  return entry.data;
}

/**
 * Store stats for a user with TTL.
 * @param {string} userId
 * @param {object} data
 */
function setStats(userId, data) {
  cache.set(String(userId), {
    data,
    expiresAt: Date.now() + TTL_MS,
  });
}

/**
 * Invalidate cached stats for a user.
 * Call after any state-changing event (generation, mood log).
 * @param {string} userId
 */
function invalidateStats(userId) {
  cache.delete(String(userId));
}

module.exports = { getStats, setStats, invalidateStats };
