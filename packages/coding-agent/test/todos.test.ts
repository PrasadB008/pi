import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { findTodos, formatTodos, parseTodoLine } from "../src/core/todos.ts";

describe("parseTodoLine", () => {
	it("matches TODO-style markers in comments", () => {
		expect(parseTodoLine("// TODO: fix this")).toEqual({ tag: "TODO", text: "fix this" });
		expect(parseTodoLine("  # fixme handle errors")).toEqual({ tag: "FIXME", text: "handle errors" });
		expect(parseTodoLine("/* HACK(bob): temp */")).toEqual({ tag: "HACK", text: "bob): temp" });
	});

	it("ignores markers outside comments", () => {
		expect(parseTodoLine('const s = "todo list";')).toBeUndefined();
		expect(parseTodoLine("the todos command")).toBeUndefined();
	});
});

describe("findTodos", () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "todos-test-"));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds todos, skips ignored dirs and binary files", () => {
		mkdirSync(join(root, "src"));
		mkdirSync(join(root, "node_modules"));
		writeFileSync(join(root, "src", "a.ts"), "const a = 1;\n// TODO: first\n// FIXME second\n");
		writeFileSync(join(root, "node_modules", "b.ts"), "// TODO: ignored\n");
		writeFileSync(join(root, "bin.dat"), "// TODO: binary\0");

		const result = findTodos(root);
		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "first" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "second" },
		]);
		expect(formatTodos(result)).toContain("`src/a.ts:2` **TODO** first");
	});

	it("truncates at maxItems", () => {
		writeFileSync(join(root, "a.ts"), "// TODO: 1\n// TODO: 2\n// TODO: 3\n");
		const result = findTodos(root, { maxItems: 2 });
		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});

	it("reports when nothing is found", () => {
		expect(formatTodos(findTodos(root))).toBe("No TODO comments found.");
	});
});

describe("/todos registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todos")).toBe(true);
	});
});
