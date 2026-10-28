import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { findTodosInContent, formatTodoResults, scanTodos } from "../src/core/todo-scanner.ts";

describe("todo scanner", () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("registers /todos as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todos")).toBe(true);
	});

	it("finds TODO and FIXME comments with line numbers and ignores prose", () => {
		const content = [
			"const a = 1; // TODO: first",
			"const b = 2;",
			"# FIXME(bob) second",
			"/* TODO third */",
			" * FIXME fourth",
			"const todoList = []; // not a tag",
			"the todo list is long",
		].join("\n");
		expect(findTodosInContent(content)).toEqual([
			{ tag: "TODO", line: 1, text: "first" },
			{ tag: "FIXME", line: 3, text: "second" },
			{ tag: "TODO", line: 4, text: "third" },
			{ tag: "FIXME", line: 5, text: "fourth" },
		]);
	});

	it("groups results by file, sorted by path, and skips ignored and binary files", () => {
		mkdirSync(join(root, "src"));
		mkdirSync(join(root, "node_modules"));
		mkdirSync(join(root, ".git"));
		writeFileSync(join(root, "src", "b.ts"), "// TODO: in b\n\n// FIXME in b again\n");
		writeFileSync(join(root, "a.ts"), "// TODO: in a\n");
		writeFileSync(join(root, "node_modules", "dep.js"), "// TODO: dependency\n");
		writeFileSync(join(root, ".git", "config"), "# TODO: git\n");
		writeFileSync(join(root, "image.bin"), Buffer.from([0, 1, 2, 0x2f, 0x2f, 0x20, 0x54, 0x4f, 0x44, 0x4f]));
		writeFileSync(join(root, "big.ts"), `// TODO: big\n${"x".repeat(200)}`);

		const results = scanTodos(root, { maxFileSize: 100 });
		expect(results.map((result) => result.file)).toEqual(["a.ts", "src/b.ts"]);
		expect(results[1].items.map((item) => item.line)).toEqual([1, 3]);

		const text = formatTodoResults(results);
		expect(text).toContain("3 items in 2 files");
		expect(text).toContain("src/b.ts\n  1: TODO in b\n  3: FIXME in b again");
	});

	it("reports when nothing is found", () => {
		expect(formatTodoResults(scanTodos(root))).toBe("No TODO or FIXME comments found.");
	});
});
