import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatTodos, scanTodos } from "../src/utils/todos.ts";

describe("scanTodos", () => {
	let root: string;

	beforeEach(() => {
		root = join(tmpdir(), `todos-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(join(root, "src"), { recursive: true });
		mkdirSync(join(root, "node_modules", "dep"), { recursive: true });
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds TODO and FIXME comments with line numbers", () => {
		writeFileSync(
			join(root, "src", "a.ts"),
			["const x = 1;", "// TODO: handle errors", "/* FIXME(bob) broken */", "const todo = 'TODO'"].join("\n"),
		);
		writeFileSync(join(root, "script.py"), "# TODO refactor\n");

		const { items, truncated } = scanTodos(root);

		expect(truncated).toBe(false);
		expect(items).toEqual([
			{ file: "script.py", line: 1, tag: "TODO", text: "refactor" },
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "handle errors" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "broken" },
		]);
	});

	it("skips node_modules, binary files and large files", () => {
		writeFileSync(join(root, "node_modules", "dep", "index.js"), "// TODO ignored\n");
		writeFileSync(join(root, "bin.dat"), Buffer.from([0, 1, 2, 0x2f, 0x2f, 0x20, 0x54]));
		writeFileSync(join(root, "big.ts"), `// TODO big\n${"x".repeat(200)}`);

		expect(scanTodos(root, { maxFileSize: 100 }).items).toEqual([]);
	});

	it("truncates at maxItems", () => {
		writeFileSync(join(root, "a.ts"), "// TODO one\n// TODO two\n// TODO three\n");

		const result = scanTodos(root, { maxItems: 2 });

		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});
});

describe("formatTodos", () => {
	it("reports when nothing is found", () => {
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO or FIXME comments found.");
	});

	it("groups items by file", () => {
		const output = formatTodos({
			items: [
				{ file: "a.ts", line: 1, tag: "TODO", text: "one" },
				{ file: "a.ts", line: 5, tag: "FIXME", text: "two" },
				{ file: "b.ts", line: 2, tag: "TODO", text: "" },
			],
			truncated: false,
		});

		expect(output).toContain("3 outstanding items in 2 files");
		expect(output).toContain("### a.ts\n\n- L1 **TODO** one\n- L5 **FIXME** two");
		expect(output).toContain("### b.ts\n\n- L2 **TODO** (no description)");
	});
});
