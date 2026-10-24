import { describe, expect, it } from "vitest";
import { VERSION } from "../src/config.ts";
import { BUILTIN_SLASH_COMMANDS, formatVersionMessage } from "../src/core/slash-commands.ts";

describe("/version", () => {
	it("is registered as a built-in command", () => {
		const command = BUILTIN_SLASH_COMMANDS.find((c) => c.name === "version");
		expect(command?.description).toBe("Show the current version");
	});

	it("prints the app name and current version", () => {
		expect(formatVersionMessage("pi", "1.2.3")).toBe("pi v1.2.3");
		expect(formatVersionMessage()).toMatch(new RegExp(` v${VERSION.replaceAll(".", "\\.")}$`));
	});

	it("has unique command names", () => {
		const names = BUILTIN_SLASH_COMMANDS.map((c) => c.name);
		expect(new Set(names).size).toBe(names.length);
	});
});
