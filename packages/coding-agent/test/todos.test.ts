import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTodos, formatTodosMarkdown, parseTodoLine } from "../src/core/todos.ts";

describe("parseTodoLine", () => {
	it("matches comment markers and ignores identifiers and prose", () => {
		expect(parseTodoLine("// TODO: fix this")).toEqual({ tag: "TODO", text: "fix this" });
		expect(parseTodoLine("  # fixme(bob) handle errors")).toEqual({ tag: "FIXME", text: "handle errors" });
		expect(parseTodoLine("/* HACK remove later */")).toEqual({ tag: "HACK", text: "remove later" });
		expect(parseTodoLine("const findTodos = () => {}")).toBeUndefined();
		expect(parseTodoLine("a todo list for the team")).toBeUndefined();
	});
});

describe("findTodos", () => {
	let root: string;

	beforeEach(() => {
		root = join(tmpdir(), `todos-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(join(root, "src"), { recursive: true });
		mkdirSync(join(root, "node_modules", "dep"), { recursive: true });
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds todos with file and line, skipping ignored directories and binary files", () => {
		writeFileSync(join(root, "src", "a.ts"), "const x = 1;\n// TODO: first\n// FIXME second\n");
		writeFileSync(join(root, "node_modules", "dep", "index.js"), "// TODO: not ours\n");
		writeFileSync(join(root, "bin.dat"), Buffer.from([0, 1, 2, 0x2f, 0x2f, 0x20, 0x54, 0x4f, 0x44, 0x4f]));

		const result = findTodos(root);

		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "first" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "second" },
		]);
		expect(formatTodosMarkdown(result)).toContain("2 items in 1 file");
	});

	it("truncates at maxItems and reports empty results", () => {
		writeFileSync(join(root, "src", "a.ts"), "// TODO: one\n// TODO: two\n// TODO: three\n");
		const result = findTodos(root, { maxItems: 2 });
		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);

		rmSync(join(root, "src", "a.ts"));
		expect(formatTodosMarkdown(findTodos(root))).toBe("No TODO comments found.");
	});
});
