import { describe, expect, it } from "vitest";
import { formatUptime } from "../src/core/format-uptime.ts";

describe("formatUptime", () => {
	it("formats sub-minute durations in seconds", () => {
		expect(formatUptime(0)).toBe("0s");
		expect(formatUptime(999)).toBe("0s");
		expect(formatUptime(45_000)).toBe("45s");
	});

	it("formats minutes and seconds", () => {
		expect(formatUptime(60_000)).toBe("1m 0s");
		expect(formatUptime(192_000)).toBe("3m 12s");
	});

	it("formats hours, minutes and seconds", () => {
		expect(formatUptime((2 * 3600 + 5 * 60 + 9) * 1000)).toBe("2h 5m 9s");
		expect(formatUptime(3600_000)).toBe("1h 0m 0s");
	});

	it("formats days", () => {
		expect(formatUptime((86400 + 4 * 3600 + 3) * 1000)).toBe("1d 4h 0m 3s");
	});

	it("treats negative and non-finite input as zero", () => {
		expect(formatUptime(-5000)).toBe("0s");
		expect(formatUptime(Number.NaN)).toBe("0s");
		expect(formatUptime(Number.POSITIVE_INFINITY)).toBe("0s");
	});
});
