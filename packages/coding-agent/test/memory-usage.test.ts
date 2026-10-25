import { describe, expect, it } from "vitest";
import { formatMemoryUsage } from "../src/core/memory-usage.ts";

const MB = 1024 * 1024;

describe("formatMemoryUsage", () => {
	it("formats rss and heap values in MB with one decimal", () => {
		const text = formatMemoryUsage({ rss: 100 * MB, heapUsed: 25.5 * MB, heapTotal: 50 * MB });
		expect(text).toBe("RSS: 100.0 MB\nHeap used: 25.5 MB\nHeap total: 50.0 MB");
	});

	it("rounds fractional megabytes", () => {
		const text = formatMemoryUsage({ rss: 1.26 * MB, heapUsed: 0, heapTotal: 0.04 * MB });
		expect(text).toBe("RSS: 1.3 MB\nHeap used: 0.0 MB\nHeap total: 0.0 MB");
	});
});
