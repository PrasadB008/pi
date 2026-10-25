import { describe, expect, it } from "vitest";
import { formatEnvInfo } from "../src/core/env-info.ts";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("formatEnvInfo", () => {
	it("prints node version, platform and pi version on separate lines", () => {
		expect(formatEnvInfo({ nodeVersion: "v22.1.0", platform: "linux", piVersion: "1.2.3" })).toBe(
			"Node: v22.1.0\nPlatform: linux\nPi: 1.2.3",
		);
	});

	it("passes values through unchanged", () => {
		const text = formatEnvInfo({ nodeVersion: "", platform: "darwin", piVersion: "0.0.0" });
		expect(text.split("\n")).toEqual(["Node: ", "Platform: darwin", "Pi: 0.0.0"]);
	});
});

describe("/envinfo registration", () => {
	it("is listed as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "envinfo")).toBe(true);
	});
});
