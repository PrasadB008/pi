import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatUptime } from "../src/utils/uptime.ts";

describe("formatUptime", () => {
	it("formats seconds only", () => {
		expect(formatUptime(0)).toBe("0s");
		expect(formatUptime(999)).toBe("0s");
		expect(formatUptime(5_000)).toBe("5s");
	});

	it("includes minutes, hours and days once non-zero", () => {
		expect(formatUptime(65_000)).toBe("1m 5s");
		expect(formatUptime(3_600_000)).toBe("1h 0m 0s");
		expect(formatUptime(93_784_000)).toBe("1d 2h 3m 4s");
	});

	it("treats negative and non-finite input as zero", () => {
		expect(formatUptime(-1000)).toBe("0s");
		expect(formatUptime(Number.NaN)).toBe("0s");
		expect(formatUptime(Number.POSITIVE_INFINITY)).toBe("0s");
	});
});

describe("/uptime2 registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "uptime2")).toBe(true);
	});
});
