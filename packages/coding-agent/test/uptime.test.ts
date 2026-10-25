import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatUptime, getSessionUptimeMs } from "../src/core/uptime.ts";

describe("formatUptime", () => {
	it("formats seconds, minutes, hours and days", () => {
		expect(formatUptime(0)).toBe("0s");
		expect(formatUptime(45_999)).toBe("45s");
		expect(formatUptime(185_000)).toBe("3m 05s");
		expect(formatUptime((2 * 3600 + 3 * 60 + 9) * 1000)).toBe("2h 03m 09s");
		expect(formatUptime((86400 + 2 * 3600 + 3 * 60 + 9) * 1000)).toBe("1d 2h 03m 09s");
	});

	it("treats negative and non-finite values as zero", () => {
		expect(formatUptime(-5000)).toBe("0s");
		expect(formatUptime(Number.NaN)).toBe("0s");
	});
});

describe("getSessionUptimeMs", () => {
	it("returns elapsed milliseconds since the start timestamp", () => {
		const start = "2024-01-01T00:00:00.000Z";
		const now = Date.parse(start) + 90_000;
		expect(getSessionUptimeMs(start, now)).toBe(90_000);
	});

	it("clamps future timestamps to zero and rejects invalid ones", () => {
		expect(getSessionUptimeMs("2024-01-01T00:01:00.000Z", Date.parse("2024-01-01T00:00:00.000Z"))).toBe(0);
		expect(getSessionUptimeMs("not a date")).toBeUndefined();
	});
});

describe("/uptime2 registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "uptime2")).toBe(true);
	});
});
