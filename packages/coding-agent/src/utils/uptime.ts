/**
 * Format a duration in milliseconds as a compact uptime string, e.g. "1d 2h 3m 4s".
 * Leading zero units are dropped; seconds are always shown. Negative or non-finite input is treated as 0.
 */
export function formatUptime(ms: number): string {
	const totalSeconds = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const parts: string[] = [];
	if (days > 0) parts.push(`${days}d`);
	if (days > 0 || hours > 0) parts.push(`${hours}h`);
	if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes}m`);
	parts.push(`${seconds}s`);
	return parts.join(" ");
}
