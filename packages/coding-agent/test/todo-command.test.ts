import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("todo command", () => {
	it("should be registered in BUILTIN_SLASH_COMMANDS", () => {
		const todoCommand = BUILTIN_SLASH_COMMANDS.find((cmd) => cmd.name === "todo");
		expect(todoCommand).toBeDefined();
		expect(todoCommand?.description).toBe("Add or list todo items");
		expect(todoCommand?.argumentHint).toBe("[<text>]");
	});

	it("should have todo command alongside other commands", () => {
		const commandNames = BUILTIN_SLASH_COMMANDS.map((cmd) => cmd.name);
		expect(commandNames).toContain("todo");
		expect(commandNames).toContain("compact");
		expect(commandNames).toContain("quit");
	});
});
