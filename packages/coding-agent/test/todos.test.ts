import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTodos, formatTodos } from "../src/utils/todos.ts";

describe("todos", () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds TODO and FIXME comments with file and line", () => {
		mkdirSync(join(root, "src"));
		writeFileSync(join(root, "src", "a.ts"), "const a = 1;\n// TODO: handle errors\nconst b = 2; // FIXME(bob) leak\n");
		writeFileSync(join(root, "script.py"), "# todo lowercase is ignored\n# TODO fix me\n");

		const items = findTodos(root);

		expect(items).toEqual([
			{ file: "script.py", line: 2, tag: "TODO", text: "fix me" },
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "handle errors" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "(bob) leak" },
		]);
	});

	it("ignores node_modules, non-comment mentions and binary files", () => {
		mkdirSync(join(root, "node_modules"));
		writeFileSync(join(root, "node_modules", "x.js"), "// TODO: vendor\n");
		writeFileSync(join(root, "code.ts"), 'const s = "TODO in a string";\n');
		writeFileSync(join(root, "bin.dat"), "// TODO binary\0");

		expect(findTodos(root)).toEqual([]);
	});

	it("limits the number of results", () => {
		writeFileSync(join(root, "many.ts"), "// TODO a\n// TODO b\n// TODO c\n");

		expect(findTodos(root, 2)).toHaveLength(2);
	});

	it("formats items grouped by file", () => {
		const output = formatTodos([
			{ file: "a.ts", line: 1, tag: "TODO", text: "one" },
			{ file: "a.ts", line: 4, tag: "FIXME", text: "two" },
		]);

		expect(output).toContain("2 items in 1 file");
		expect(output).toContain("**a.ts**");
		expect(output).toContain("- L4 **FIXME** two");
		expect(formatTodos([])).toBe("No TODO or FIXME comments found.");
	});
});
