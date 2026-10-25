import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatUptime } from "../src/core/uptime.ts";

describe("formatUptime", () => {
	it("shows only seconds under a minute", () => {
		expect(formatUptime(0)).toBe("0s");
		expect(formatUptime(999)).toBe("0s");
		expect(formatUptime(45_000)).toBe("45s");
	});

	it("shows minutes and seconds under an hour", () => {
		expect(formatUptime(60_000)).toBe("1m 0s");
		expect(formatUptime(125_000)).toBe("2m 5s");
	});

	it("keeps inner zero units once a larger unit is present", () => {
		expect(formatUptime(3_600_000)).toBe("1h 0m 0s");
		expect(formatUptime(3_723_000)).toBe("1h 2m 3s");
		expect(formatUptime(93_784_000)).toBe("1d 2h 3m 4s");
		expect(formatUptime(86_400_000)).toBe("1d 0h 0m 0s");
	});

	it("treats negative and non-finite input as zero", () => {
		expect(formatUptime(-5000)).toBe("0s");
		expect(formatUptime(Number.NaN)).toBe("0s");
		expect(formatUptime(Number.POSITIVE_INFINITY)).toBe("0s");
	});
});

describe("/uptime2 registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "uptime2")).toBe(true);
	});
});
