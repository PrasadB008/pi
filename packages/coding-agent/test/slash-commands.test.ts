import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS, formatPwdOutput } from "../src/core/slash-commands.ts";

describe("BUILTIN_SLASH_COMMANDS", () => {
	it("registers /pwd with a description and no arguments", () => {
		const pwd = BUILTIN_SLASH_COMMANDS.filter((command) => command.name === "pwd");
		expect(pwd).toHaveLength(1);
		expect(pwd[0].description).toBe("Print the current working directory");
		expect(pwd[0].argumentHint).toBeUndefined();
	});

	it("has unique command names", () => {
		const names = BUILTIN_SLASH_COMMANDS.map((command) => command.name);
		expect(new Set(names).size).toBe(names.length);
	});
});

describe("formatPwdOutput", () => {
	it("returns the absolute working directory", () => {
		const cwd = path.resolve("some", "project");
		expect(formatPwdOutput(cwd)).toBe(cwd);
	});

	it("resolves relative paths to absolute", () => {
		expect(formatPwdOutput("foo")).toBe(path.resolve("foo"));
		expect(path.isAbsolute(formatPwdOutput("foo"))).toBe(true);
	});
});
