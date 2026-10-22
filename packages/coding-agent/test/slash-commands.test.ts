import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("BUILTIN_SLASH_COMMANDS", () => {
	it("registers /todo with an argument hint", () => {
		const todo = BUILTIN_SLASH_COMMANDS.filter((command) => command.name === "todo");
		expect(todo).toHaveLength(1);
		expect(todo[0]?.argumentHint).toBe("<text>");
	});
});
