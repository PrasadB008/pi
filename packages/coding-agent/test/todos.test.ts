import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { findTodoComments, formatTodoComments, parseTodoGrepOutput } from "../src/utils/todos.ts";

describe("todos", () => {
	const dirs: string[] = [];

	afterEach(() => {
		for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
	});

	test("registers /todos as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todos")).toBe(true);
	});

	test("parseTodoGrepOutput extracts file, line, tag and text", () => {
		const todos = parseTodoGrepOutput(
			["src/a.ts:12:\t// TODO: handle errors", "src/b.ts:3:# FIXME broken", "garbage line", ""].join("\n"),
		);
		expect(todos).toEqual([
			{ file: "src/a.ts", line: 12, tag: "TODO", text: "// TODO: handle errors" },
			{ file: "src/b.ts", line: 3, tag: "FIXME", text: "# FIXME broken" },
		]);
	});

	test("formatTodoComments groups by file and handles empty and truncated lists", () => {
		expect(formatTodoComments([])).toBe("No TODO or FIXME comments found.");

		const todos = [
			{ file: "a.ts", line: 1, tag: "TODO", text: "// TODO one" },
			{ file: "a.ts", line: 2, tag: "TODO", text: "// TODO two" },
			{ file: "b.ts", line: 5, tag: "FIXME", text: "// FIXME three" },
		];
		const output = formatTodoComments(todos);
		expect(output).toContain("3 outstanding items");
		expect(output).toContain("**a.ts**");
		expect(output).toContain("`a.ts:2` // TODO two");
		expect(output).toContain("`b.ts:5` // FIXME three");

		expect(formatTodoComments(todos, 1)).toContain("...and 2 more not shown.");
	});

	test("findTodoComments scans a directory and respects .gitignore", async () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		dirs.push(dir);
		mkdirSync(join(dir, "src"));
		mkdirSync(join(dir, "ignored"));
		writeFileSync(join(dir, ".gitignore"), "ignored/\n");
		writeFileSync(join(dir, "src", "main.ts"), "const a = 1;\n// TODO: refactor this\n");
		writeFileSync(join(dir, "ignored", "skip.ts"), "// TODO: should not appear\n");

		const todos = await findTodoComments(dir);
		expect(todos).toHaveLength(1);
		expect(todos[0]).toMatchObject({ line: 2, tag: "TODO", text: "// TODO: refactor this" });
		expect(todos[0]?.file.replace(/\\/g, "/")).toBe("src/main.ts");
	});
});
