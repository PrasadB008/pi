import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { formatTodos, MAX_TODO_ITEMS, scanTodos } from "../src/utils/todos.ts";

describe("scanTodos", () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	test("finds whole-word TODO and FIXME with relative paths and line numbers", async () => {
		mkdirSync(join(root, "src"));
		writeFileSync(join(root, "src", "a.ts"), "const a = 1;\n// TODO: fix this\n// FIXME later\n");
		writeFileSync(join(root, "b.ts"), "// TODOS are not matched, nor is mastodon\n// todo lowercase\n");

		const result = await scanTodos(root);
		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "src/a.ts", line: 2, text: "// TODO: fix this" },
			{ file: "src/a.ts", line: 3, text: "// FIXME later" },
		]);
	});

	test("skips dependency directories and binary files", async () => {
		mkdirSync(join(root, "node_modules", "pkg"), { recursive: true });
		writeFileSync(join(root, "node_modules", "pkg", "index.js"), "// TODO ignored\n");
		mkdirSync(join(root, ".git"));
		writeFileSync(join(root, ".git", "config"), "TODO ignored\n");
		writeFileSync(join(root, "image.bin"), "TODO\0binary");
		writeFileSync(join(root, "kept.md"), "TODO kept\n");

		const result = await scanTodos(root);
		expect(result.items.map((item) => item.file)).toEqual(["kept.md"]);
	});

	test("caps results and reports truncation", async () => {
		writeFileSync(join(root, "many.txt"), "TODO\n".repeat(MAX_TODO_ITEMS + 10));

		const result = await scanTodos(root);
		expect(result.items).toHaveLength(MAX_TODO_ITEMS);
		expect(result.truncated).toBe(true);
		expect(formatTodos(result)).toContain("limit reached");
	});
});

describe("formatTodos", () => {
	test("groups items by file", () => {
		const markdown = formatTodos({
			items: [
				{ file: "a.ts", line: 1, text: "// TODO one" },
				{ file: "a.ts", line: 5, text: "// FIXME two" },
				{ file: "b.ts", line: 2, text: "// TODO three" },
			],
			truncated: false,
		});
		expect(markdown).toBe(
			"3 matches in 2 files.\n\n**a.ts**\n- line 1: // TODO one\n- line 5: // FIXME two\n\n**b.ts**\n- line 2: // TODO three",
		);
	});

	test("reports when nothing is found", () => {
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO or FIXME comments found.");
	});
});
