import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("/todo slash command", () => {
	it("is registered once as a built-in command that takes optional text", () => {
		const matches = BUILTIN_SLASH_COMMANDS.filter((command) => command.name === "todo");
		expect(matches).toHaveLength(1);
		expect(matches[0]?.argumentHint).toBe("<text>");
	});
});
