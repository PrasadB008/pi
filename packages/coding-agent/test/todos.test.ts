import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTodosInText, formatTodosMarkdown, scanTodos } from "../src/core/todos.ts";

describe("findTodosInText", () => {
	it("finds TODO and FIXME in comments with line numbers", () => {
		const items = findTodosInText(
			["const a = 1;", "// TODO: first", "/* FIXME(bob): second */", "# TODO third", "const s = 'TODO';"].join("\n"),
		);
		expect(items).toEqual([
			{ line: 2, tag: "TODO", text: "first" },
			{ line: 3, tag: "FIXME", text: "bob): second" },
			{ line: 4, tag: "TODO", text: "third" },
		]);
	});
});

describe("scanTodos", () => {
	let root: string;

	beforeEach(() => {
		root = join(tmpdir(), `todos-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(join(root, "src"), { recursive: true });
		mkdirSync(join(root, "node_modules", "pkg"), { recursive: true });
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("groups by file, skips ignored dirs, binary and oversized files", async () => {
		writeFileSync(join(root, "src", "a.ts"), "// TODO: one\nconst x = 1;\n// FIXME two\n");
		writeFileSync(join(root, "b.py"), "# TODO: py\n");
		writeFileSync(join(root, "node_modules", "pkg", "index.js"), "// TODO: ignored\n");
		writeFileSync(join(root, "bin.dat"), Buffer.from([0, 1, 2, 0x2f, 0x2f, 0x20, 0x54, 0x4f, 0x44, 0x4f]));
		writeFileSync(join(root, "big.ts"), `// TODO: big\n${"x".repeat(200)}`);

		const result = await scanTodos(root, { maxFileSize: 100 });
		expect(result.files.map((f) => f.file)).toEqual(["b.py", "src/a.ts"]);
		expect(result.totalItems).toBe(3);
		expect(result.truncated).toBe(false);

		const markdown = formatTodosMarkdown(result);
		expect(markdown).toContain("src/a.ts:3");
		expect(markdown).toContain("3 items in 2 files");
	});

	it("caps the number of items and reports truncation", async () => {
		writeFileSync(join(root, "a.ts"), "// TODO 1\n// TODO 2\n");
		writeFileSync(join(root, "b.ts"), "// TODO 3\n");

		const result = await scanTodos(root, { maxItems: 2 });
		expect(result.totalItems).toBe(2);
		expect(result.truncated).toBe(true);
		expect(result.files.every((f) => f.items.length > 0)).toBe(true);
	});

	it("reports when nothing is found", async () => {
		const result = await scanTodos(root);
		expect(formatTodosMarkdown(result)).toBe("No TODO or FIXME comments found.");
	});
});
