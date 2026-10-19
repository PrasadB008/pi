import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoMarkdown, matchTodoLine, scanTodos } from "../src/utils/todo-scan.ts";

describe("matchTodoLine", () => {
	test("matches TODO and FIXME in common comment styles", () => {
		expect(matchTodoLine("const a = 1; // TODO: handle errors")).toEqual({ tag: "TODO", text: "handle errors" });
		expect(matchTodoLine("# FIXME broken on windows")).toEqual({ tag: "FIXME", text: "broken on windows" });
		expect(matchTodoLine("/* TODO(me): later */")).toEqual({ tag: "TODO", text: "later" });
		expect(matchTodoLine(" * TODO wrap up")).toEqual({ tag: "TODO", text: "wrap up" });
	});

	test("ignores lines without a comment marker or with partial words", () => {
		expect(matchTodoLine("const TODO = 1;")).toBeUndefined();
		expect(matchTodoLine("// TODOS are tracked elsewhere")).toBeUndefined();
		expect(matchTodoLine("plain text")).toBeUndefined();
	});
});

describe("scanTodos", () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(path.join(tmpdir(), "pi-todo-"));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	test("finds todos with file and line, skipping ignored directories and binary files", async () => {
		mkdirSync(path.join(dir, "src"));
		mkdirSync(path.join(dir, "node_modules"));
		writeFileSync(path.join(dir, "src", "a.ts"), "const x = 1;\n// TODO: first\n// FIXME second\n");
		writeFileSync(path.join(dir, "node_modules", "dep.js"), "// TODO: not mine\n");
		writeFileSync(path.join(dir, "bin.dat"), "// TODO binary\0data");

		const result = await scanTodos(dir);

		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "first" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "second" },
		]);
	});

	test("truncates at maxItems", async () => {
		writeFileSync(path.join(dir, "a.ts"), "// TODO 1\n// TODO 2\n// TODO 3\n");

		const result = await scanTodos(dir, { maxItems: 2 });

		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});
});

describe("formatTodoMarkdown", () => {
	test("reports when nothing was found", () => {
		expect(formatTodoMarkdown({ items: [], truncated: false })).toBe("No TODO comments found.");
	});

	test("groups items by file", () => {
		const markdown = formatTodoMarkdown({
			items: [
				{ file: "a.ts", line: 1, tag: "TODO", text: "one" },
				{ file: "a.ts", line: 4, tag: "FIXME", text: "two" },
				{ file: "b.ts", line: 2, tag: "TODO", text: "" },
			],
			truncated: false,
		});

		expect(markdown).toBe(
			[
				"**a.ts**",
				"- L1 **TODO**: one",
				"- L4 **FIXME**: two",
				"",
				"**b.ts**",
				"- L2 **TODO**",
				"",
				"3 item(s)",
			].join("\n"),
		);
	});
});

describe("/todo slash command", () => {
	test("is registered as a built-in command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
