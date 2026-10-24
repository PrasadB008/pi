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

	it("finds TODO and FIXME comments with file and line", async () => {
		mkdirSync(join(root, "src"));
		writeFileSync(
			join(root, "src", "a.ts"),
			"const a = 1;\n// TODO: handle errors\nconst b = 2; // FIXME(bob) leak\n",
		);
		writeFileSync(join(root, "script.py"), "# todo lowercase is ignored\n# TODO fix me\n");

		const { items, truncated } = await findTodos(root);

		expect(truncated).toBe(false);
		expect(items).toEqual([
			{ file: "script.py", line: 2, tag: "TODO", text: "fix me" },
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "handle errors" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "(bob) leak" },
		]);
	});

	it("ignores node_modules, non-comment mentions and binary files", async () => {
		mkdirSync(join(root, "node_modules"));
		writeFileSync(join(root, "node_modules", "x.js"), "// TODO: vendor\n");
		writeFileSync(join(root, "code.ts"), 'const s = "TODO in a string";\n');
		writeFileSync(join(root, "bin.dat"), "// TODO binary\0");

		expect((await findTodos(root)).items).toEqual([]);
	});

	it("only treats comment syntax of the file type as comments", async () => {
		writeFileSync(join(root, "notes.md"), "* TODO list for release\n# TODO heading\n<!-- TODO hidden -->\n");
		writeFileSync(join(root, "a.ts"), "# TODO not a ts comment\n * FIXME block continuation\n");

		const { items } = await findTodos(root);

		expect(items).toEqual([
			{ file: "a.ts", line: 2, tag: "FIXME", text: "block continuation" },
			{ file: "notes.md", line: 3, tag: "TODO", text: "hidden" },
		]);
	});

	it("limits results and reports truncation only when more exist", async () => {
		writeFileSync(join(root, "many.ts"), "// TODO a\n// TODO b\n// TODO c\n");

		const limited = await findTodos(root, 2);
		expect(limited.items).toHaveLength(2);
		expect(limited.truncated).toBe(true);

		const exact = await findTodos(root, 3);
		expect(exact.items).toHaveLength(3);
		expect(exact.truncated).toBe(false);
		expect(formatTodos(exact, 3)).not.toContain("limited");
		expect(formatTodos(limited, 2)).toContain("(limited to the first 2)");
	});

	it("truncates very long lines", async () => {
		writeFileSync(join(root, "min.js"), `// TODO ${"x".repeat(5000)}\n`);

		const { items } = await findTodos(root);

		expect(items).toHaveLength(1);
		expect(items[0].text.length).toBeLessThanOrEqual(200);
	});

	it("formats items grouped by file and escapes Markdown", () => {
		const output = formatTodos({
			items: [
				{ file: "a_b.ts", line: 1, tag: "TODO", text: "one" },
				{ file: "a_b.ts", line: 4, tag: "FIXME", text: "use *bold* <b>x</b> [l](u)" },
			],
			truncated: false,
		});

		expect(output).toContain("2 items in 1 file");
		expect(output).toContain("**a\\_b.ts**");
		expect(output).toContain("- L4 **FIXME** use \\*bold\\* \\<b\\>x\\</b\\> \\[l\\]\\(u\\)");
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO or FIXME comments found.");
	});
});
