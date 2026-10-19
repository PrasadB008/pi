import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoMarkdown, parseTodoLine, scanTodos } from "../src/utils/todo-scan.ts";

describe("parseTodoLine", () => {
	test("matches TODO and FIXME in comments", () => {
		expect(parseTodoLine("const a = 1; // TODO: handle errors")).toEqual({ tag: "TODO", text: "handle errors" });
		expect(parseTodoLine("# FIXME(bob) broken")).toEqual({ tag: "FIXME", text: "broken" });
		expect(parseTodoLine("/* TODO tidy up */")).toEqual({ tag: "TODO", text: "tidy up" });
	});

	test("ignores prose and identifiers", () => {
		expect(parseTodoLine("const TODO_LIST = []")).toBeUndefined();
		expect(parseTodoLine("This is a TODO item in prose")).toBeUndefined();
	});
});

describe("scanTodos", () => {
	let root: string;

	beforeEach(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), "todo-scan-"));
	});

	afterEach(() => {
		fs.rmSync(root, { recursive: true, force: true });
	});

	test("finds todos with relative paths and line numbers, skipping ignored dirs and binaries", () => {
		fs.mkdirSync(path.join(root, "src"));
		fs.mkdirSync(path.join(root, "node_modules"));
		fs.writeFileSync(path.join(root, "src", "a.ts"), "const x = 1;\n// TODO: first\n");
		fs.writeFileSync(path.join(root, "node_modules", "b.js"), "// TODO: ignored\n");
		fs.writeFileSync(path.join(root, "bin.dat"), Buffer.from([0, 1, 2, 47, 47, 32, 84, 79, 68, 79]));

		const result = scanTodos(root);
		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([{ file: "src/a.ts", line: 2, tag: "TODO", text: "first" }]);
	});

	test("truncates at maxItems", () => {
		fs.writeFileSync(path.join(root, "a.ts"), "// TODO: 1\n// TODO: 2\n// TODO: 3\n");
		const result = scanTodos(root, 2);
		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});
});

describe("formatTodoMarkdown", () => {
	test("reports when nothing is found", () => {
		expect(formatTodoMarkdown({ items: [], truncated: false })).toBe("No TODO comments found.");
	});

	test("lists matches", () => {
		const out = formatTodoMarkdown({ items: [{ file: "a.ts", line: 3, tag: "TODO", text: "x" }], truncated: false });
		expect(out).toBe("- `a.ts:3` **TODO** x");
	});
});

describe("/todo registration", () => {
	test("is a builtin slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todo")).toBe(true);
	});
});
