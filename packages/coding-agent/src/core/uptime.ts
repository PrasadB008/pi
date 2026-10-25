/**
 * Format a duration in milliseconds as a short human-readable string,
 * e.g. "45s", "3m 05s", "2h 03m 09s", "1d 2h 03m 09s".
 * Negative or non-finite values are treated as zero.
 */
export function formatUptime(ms: number): string {
	const totalSeconds = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const pad = (value: number) => String(value).padStart(2, "0");

	if (days > 0) return `${days}d ${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
	if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
	if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
	return `${seconds}s`;
}

/**
 * Uptime of a session given its ISO start timestamp. Returns undefined if the
 * timestamp cannot be parsed.
 */
export function getSessionUptimeMs(startTimestamp: string, now: number = Date.now()): number | undefined {
	const start = Date.parse(startTimestamp);
	if (Number.isNaN(start)) return undefined;
	return Math.max(0, now - start);
}
