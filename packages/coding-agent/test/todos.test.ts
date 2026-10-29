import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatTodos, scanTodos } from "../src/utils/todos.ts";

describe("scanTodos", () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds whole-word TODO and FIXME with line numbers, ordered by path", () => {
		mkdirSync(join(root, "src"));
		writeFileSync(join(root, "src", "b.ts"), "const a = 1;\n// TODO: first\n// FIXME second\n");
		writeFileSync(join(root, "a.ts"), "// TODOS are not matches\n// TODO real\n");

		return scanTodos(root).then((result) => {
			expect(result.truncated).toBe(false);
			expect(result.items).toEqual([
				{ file: "a.ts", line: 2, tag: "TODO", text: "// TODO real" },
				{ file: "src/b.ts", line: 2, tag: "TODO", text: "// TODO: first" },
				{ file: "src/b.ts", line: 3, tag: "FIXME", text: "// FIXME second" },
			]);
		});
	});

	it("skips generated directories, binary files and large files", async () => {
		for (const dir of ["node_modules", ".git", "dist", "build", "coverage"]) {
			mkdirSync(join(root, dir));
			writeFileSync(join(root, dir, "x.ts"), "// TODO ignored\n");
		}
		writeFileSync(join(root, "bin.dat"), Buffer.concat([Buffer.from([0]), Buffer.from("TODO binary")]));
		writeFileSync(join(root, "big.txt"), `TODO big\n${"x".repeat(1024 * 1024)}`);
		writeFileSync(join(root, "keep.ts"), "// TODO keep\n");

		const result = await scanTodos(root);
		expect(result.items.map((item) => item.file)).toEqual(["keep.ts"]);
	});

	it("caps results and reports truncation", async () => {
		writeFileSync(join(root, "many.ts"), "// TODO a\n// TODO b\n// TODO c\n");

		const result = await scanTodos(root, 2);
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
				{ file: "a.ts", line: 1, tag: "TODO", text: "// TODO one" },
				{ file: "a.ts", line: 4, tag: "FIXME", text: "// FIXME two" },
				{ file: "b.ts", line: 2, tag: "TODO", text: "// TODO three" },
			],
			truncated: false,
		});
		expect(output).toContain("3 outstanding in 2 files");
		expect(output).toContain("**a.ts**\n- line 1: // TODO one\n- line 4: // FIXME two");
		expect(output).toContain("**b.ts**\n- line 2: // TODO three");
	});
});
