import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("todo command", () => {
	it("should be registered in built-in slash commands", () => {
		const todoCommand = BUILTIN_SLASH_COMMANDS.find((cmd) => cmd.name === "todo");
		expect(todoCommand).toBeDefined();
		expect(todoCommand?.description).toBe("Add to or list todo items");
		expect(todoCommand?.argumentHint).toBe("[text]");
	});

	it("should have todo command after quit command", () => {
		const quitIndex = BUILTIN_SLASH_COMMANDS.findIndex((cmd) => cmd.name === "quit");
		const todoIndex = BUILTIN_SLASH_COMMANDS.findIndex((cmd) => cmd.name === "todo");
		expect(quitIndex).toBeGreaterThanOrEqual(0);
		expect(todoIndex).toBeGreaterThanOrEqual(0);
		expect(todoIndex).toBe(quitIndex + 1);
	});
});
