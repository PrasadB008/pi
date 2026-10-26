import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatTodos, scanTodos } from "../src/modes/interactive/todos.ts";

describe("scanTodos", () => {
	let root: string;

	beforeEach(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		fs.rmSync(root, { recursive: true, force: true });
	});

	it("finds TODO and FIXME comments and skips ignored directories and binaries", () => {
		fs.mkdirSync(path.join(root, "src"));
		fs.mkdirSync(path.join(root, "node_modules"));
		fs.writeFileSync(
			path.join(root, "src", "a.ts"),
			["const x = 1;", "// TODO: handle errors", "/* FIXME(bob): leak */", "const todo = 'not a comment';"].join("\n"),
		);
		fs.writeFileSync(path.join(root, "script.py"), "# todo lowercase works\n");
		fs.writeFileSync(path.join(root, "node_modules", "dep.js"), "// TODO: ignored\n");
		fs.writeFileSync(path.join(root, "bin.dat"), Buffer.from([0, 1, 2, 47, 47, 32, 84, 79, 68, 79]));

		const result = scanTodos(root);

		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "script.py", line: 1, tag: "TODO", text: "lowercase works" },
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "handle errors" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "leak */" },
		]);
	});

	it("truncates at maxResults and formats output grouped by file", () => {
		fs.writeFileSync(path.join(root, "a.ts"), "// TODO: one\n// TODO: two\n// TODO: three\n");

		const result = scanTodos(root, { maxResults: 2 });
		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);

		const text = formatTodos(result);
		expect(text).toContain("a.ts\n  1: TODO one\n  2: TODO two");
		expect(text).toContain("Showing first 2 items (more exist).");
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO or FIXME comments found.");
	});
});
