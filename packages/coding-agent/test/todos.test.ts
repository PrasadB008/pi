import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { findTodos, formatTodos } from "../src/core/todos.ts";

describe("todos", () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("lists TODO and FIXME comments with line numbers, grouped by file", async () => {
		mkdirSync(join(root, "src"));
		writeFileSync(join(root, "src", "a.ts"), "const a = 1;\n// TODO: first\nconst b = 2; // FIXME second\n");
		writeFileSync(join(root, "b.py"), "# TODO(me) python\n");

		const result = await findTodos(root);
		expect(result.truncated).toBe(false);
		expect(result.items.map((i) => `${i.file}:${i.line}:${i.tag}`)).toEqual([
			"b.py:1:TODO",
			"src/a.ts:2:TODO",
			"src/a.ts:3:FIXME",
		]);
		expect(formatTodos(result)).toBe(
			["b.py", "  1: TODO (me) python", "", "src/a.ts", "  2: TODO first", "  3: FIXME second"].join("\n"),
		);
	});

	it("skips ignored directories, non-comment mentions and binary files", async () => {
		mkdirSync(join(root, "node_modules"));
		writeFileSync(join(root, "node_modules", "x.js"), "// TODO ignored\n");
		writeFileSync(join(root, "plain.ts"), 'const s = "TODO";\n');
		writeFileSync(join(root, "bin.dat"), "// TODO\0binary\n");

		const result = await findTodos(root);
		expect(result.items).toEqual([]);
		expect(formatTodos(result)).toBe("No TODO or FIXME comments found.");
	});

	it("caps results and reports truncation", async () => {
		writeFileSync(join(root, "many.ts"), "// TODO a\n// TODO b\n// TODO c\n");

		const result = await findTodos(root, 2);
		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
		expect(formatTodos(result)).toContain("Showing the first 2 matches");
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todos")).toBe(true);
	});
});
