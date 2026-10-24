import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("BUILTIN_SLASH_COMMANDS", () => {
	it("registers /version with a description", () => {
		const command = BUILTIN_SLASH_COMMANDS.find((c) => c.name === "version");
		expect(command).toBeDefined();
		expect(command?.description).toBe("Show the current version");
	});

	it("has unique command names", () => {
		const names = BUILTIN_SLASH_COMMANDS.map((c) => c.name);
		expect(new Set(names).size).toBe(names.length);
	});
});
