import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatTodos, parseTodoLine, scanTodos } from "../src/utils/todos.ts";

describe("parseTodoLine", () => {
	it("matches TODO and FIXME in comments", () => {
		expect(parseTodoLine("// TODO: fix this")).toEqual({ tag: "TODO", text: "fix this" });
		expect(parseTodoLine("  # FIXME(bob) handle null")).toEqual({ tag: "FIXME", text: "handle null" });
		expect(parseTodoLine("/* TODO tidy */")).toEqual({ tag: "TODO", text: "tidy" });
	});

	it("ignores identifiers and prose", () => {
		expect(parseTodoLine("const todos = []")).toBeUndefined();
		expect(parseTodoLine("// the todos list")).toBeUndefined();
		expect(parseTodoLine("const TODO_PATTERN = 1")).toBeUndefined();
	});
});

describe("scanTodos", () => {
	let root: string;

	beforeEach(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		fs.rmSync(root, { recursive: true, force: true });
	});

	it("finds todos, skips node_modules and binary files", () => {
		fs.mkdirSync(path.join(root, "src"));
		fs.mkdirSync(path.join(root, "node_modules"));
		fs.writeFileSync(path.join(root, "src", "a.ts"), "const a = 1;\n// TODO: first\n// FIXME second\n");
		fs.writeFileSync(path.join(root, "node_modules", "b.js"), "// TODO: ignored\n");
		fs.writeFileSync(path.join(root, "bin.dat"), "// TODO: binary\0");

		const result = scanTodos(root);
		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "first" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "second" },
		]);
	});

	it("truncates at maxItems", () => {
		fs.writeFileSync(path.join(root, "a.ts"), "// TODO: 1\n// TODO: 2\n// TODO: 3\n");
		const result = scanTodos(root, { maxItems: 2 });
		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});
});

describe("formatTodos", () => {
	it("reports when nothing is found", () => {
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO or FIXME comments found.");
	});

	it("groups by file", () => {
		const text = formatTodos({
			items: [{ file: "a.ts", line: 2, tag: "TODO", text: "x" }],
			truncated: false,
		});
		expect(text).toContain("1 item in 1 file");
		expect(text).toContain("**a.ts**");
		expect(text).toContain("- L2 TODO: x");
	});
});
