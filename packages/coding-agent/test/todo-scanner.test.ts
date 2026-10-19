import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodos, scanTodos } from "../src/core/todo-scanner.ts";

describe("todo scanner", () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "pi-todo-"));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("registers /todo as a builtin slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todo")).toBe(true);
	});

	it("finds TODO and FIXME comments with file and line", () => {
		mkdirSync(join(root, "src"));
		writeFileSync(join(root, "src", "a.ts"), "const x = 1;\n// TODO: handle errors\n/* FIXME broken */\n");
		writeFileSync(join(root, "script.py"), "# todo(me): rename\n");

		const todos = scanTodos(root);

		expect(todos).toEqual([
			{ file: "script.py", line: 1, tag: "TODO", text: "rename" },
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "handle errors" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "broken */" },
		]);
	});

	it("ignores identifiers and strings that are not comments", () => {
		writeFileSync(join(root, "b.ts"), 'const todoList = [];\nconst s = "TODO";\n');
		expect(scanTodos(root)).toEqual([]);
	});

	it("skips node_modules, .git and binary files", () => {
		mkdirSync(join(root, "node_modules"));
		mkdirSync(join(root, ".git"));
		writeFileSync(join(root, "node_modules", "x.js"), "// TODO: dep\n");
		writeFileSync(join(root, ".git", "y"), "// TODO: git\n");
		writeFileSync(join(root, "bin.dat"), "\u0000// TODO: binary\n");
		expect(scanTodos(root)).toEqual([]);
	});

	it("respects the result limit", () => {
		writeFileSync(join(root, "c.ts"), "// TODO: 1\n// TODO: 2\n// TODO: 3\n");
		expect(scanTodos(root, { limit: 2 })).toHaveLength(2);
	});

	it("formats results and the empty case", () => {
		expect(formatTodos([])).toBe("No TODO comments found.");
		expect(formatTodos([{ file: "a.ts", line: 4, tag: "TODO", text: "x" }])).toBe("1 TODO comment\na.ts:4  TODO: x");
	});
});
