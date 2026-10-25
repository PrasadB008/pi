import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("/foo slash command", () => {
	it("is registered exactly once as a built-in command", () => {
		const matches = BUILTIN_SLASH_COMMANDS.filter((command) => command.name === "foo");
		expect(matches).toHaveLength(1);
		expect(matches[0]?.description).toBe("Print foo");
	});
});
