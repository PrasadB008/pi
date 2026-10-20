import { describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("BUILTIN_SLASH_COMMANDS", () => {
	test("registers /todo with an argument hint", () => {
		const todo = BUILTIN_SLASH_COMMANDS.find((command) => command.name === "todo");
		expect(todo).toBeDefined();
		expect(todo?.argumentHint).toBe("<text>");
	});

	test("has unique command names", () => {
		const names = BUILTIN_SLASH_COMMANDS.map((command) => command.name);
		expect(new Set(names).size).toBe(names.length);
	});
});
