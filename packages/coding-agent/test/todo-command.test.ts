import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("todo slash command", () => {
	it("is registered in BUILTIN_SLASH_COMMANDS", () => {
		const todoCommand = BUILTIN_SLASH_COMMANDS.find((cmd) => cmd.name === "todo");
		expect(todoCommand).toBeDefined();
		expect(todoCommand?.description).toBe("Add or list todo items");
		expect(todoCommand?.argumentHint).toBe("[<text>]");
	});

	it("has correct position in command list", () => {
		const todoIndex = BUILTIN_SLASH_COMMANDS.findIndex((cmd) => cmd.name === "todo");
		const quitIndex = BUILTIN_SLASH_COMMANDS.findIndex((cmd) => cmd.name === "quit");
		expect(todoIndex).toBeGreaterThan(-1);
		expect(quitIndex).toBeGreaterThan(-1);
		expect(todoIndex).toBeLessThan(quitIndex);
	});
});
