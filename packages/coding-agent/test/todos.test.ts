import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTodos, formatTodos } from "../src/core/todos.ts";

describe("findTodos", () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds TODO and FIXME with line numbers and skips ignored dirs and binary files", () => {
		mkdirSync(join(root, "src"));
		mkdirSync(join(root, "node_modules"));
		writeFileSync(join(root, "src", "a.ts"), "const a = 1;\n// TODO: fix a\n// FIXME broken\n");
		writeFileSync(join(root, "node_modules", "dep.js"), "// TODO ignored\n");
		writeFileSync(join(root, "bin.dat"), Buffer.from([0, 1, 2, 84, 79, 68, 79]));
		writeFileSync(join(root, "notodo.txt"), "TODOS are not matched\n");

		const result = findTodos(root);

		expect(result.truncated).toBe(false);
		expect(result.items.map((i) => [i.file, i.line, i.kind])).toEqual([
			["src/a.ts", 2, "TODO"],
			["src/a.ts", 3, "FIXME"],
		]);
		const text = formatTodos(result);
		expect(text).toContain("2 items in 1 file");
		expect(text).toContain("**src/a.ts**");
		expect(text).toContain("L2:");
	});

	it("caps results and reports truncation", () => {
		writeFileSync(join(root, "a.txt"), "TODO 1\nTODO 2\nTODO 3\n");

		const result = findTodos(root, 2);

		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
		expect(formatTodos(result)).toContain("more exist");
	});

	it("reports when nothing is found", () => {
		expect(formatTodos(findTodos(root))).toBe("No TODO or FIXME comments found.");
	});
});
