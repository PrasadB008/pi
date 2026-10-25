export interface MemoryUsageSnapshot {
	rss: number;
	heapUsed: number;
	heapTotal: number;
}

const BYTES_PER_MB = 1024 * 1024;

function toMb(bytes: number): string {
	return (bytes / BYTES_PER_MB).toFixed(1);
}

/** Format a memory usage snapshot (in bytes) as multi-line text with values in MB. */
export function formatMemoryUsage(usage: MemoryUsageSnapshot): string {
	return [
		`RSS: ${toMb(usage.rss)} MB`,
		`Heap used: ${toMb(usage.heapUsed)} MB`,
		`Heap total: ${toMb(usage.heapTotal)} MB`,
	].join("\n");
}
