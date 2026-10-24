/**
 * Format a duration in milliseconds as a short human friendly string,
 * e.g. "45s", "3m 12s", "2h 5m 9s", "1d 4h 0m 3s".
 * Leading zero units are omitted; negative or non-finite input is treated as 0.
 */
export function formatUptime(durationMs: number): string {
	const totalSeconds = Number.isFinite(durationMs) && durationMs > 0 ? Math.floor(durationMs / 1000) : 0;
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
	if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
	if (minutes > 0) return `${minutes}m ${seconds}s`;
	return `${seconds}s`;
}
