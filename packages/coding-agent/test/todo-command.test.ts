import { describe, it, expect } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("todo command", () => {
	it("should be registered in BUILTIN_SLASH_COMMANDS", () => {
		const todoCommand = BUILTIN_SLASH_COMMANDS.find((cmd) => cmd.name === "todo");
		expect(todoCommand).toBeDefined();
		expect(todoCommand?.description).toBe("Add or list todo items");
		expect(todoCommand?.argumentHint).toBe("[<text>]");
	});

	it("should have correct command structure", () => {
		const todoCommand = BUILTIN_SLASH_COMMANDS.find((cmd) => cmd.name === "todo");
		expect(todoCommand).toHaveProperty("name");
		expect(todoCommand).toHaveProperty("description");
		expect(todoCommand).toHaveProperty("argumentHint");
	});
});
