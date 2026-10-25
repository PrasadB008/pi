import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("BUILTIN_SLASH_COMMANDS", () => {
	it("registers /foo exactly once with a description", () => {
		const matches = BUILTIN_SLASH_COMMANDS.filter((command) => command.name === "foo");
		expect(matches).toHaveLength(1);
		expect(matches[0].description).toBe("Print foo");
	});

	it("has unique command names", () => {
		const names = BUILTIN_SLASH_COMMANDS.map((command) => command.name);
		expect(new Set(names).size).toBe(names.length);
	});
});
