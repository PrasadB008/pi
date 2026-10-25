import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTodos, formatTodos } from "../src/core/todos.ts";

describe("findTodos", () => {
	let root: string;

	beforeEach(() => {
		root = join(tmpdir(), `todos-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(join(root, "src"), { recursive: true });
		mkdirSync(join(root, "node_modules", "dep"), { recursive: true });
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds TODO and FIXME comments and skips ignored directories and binary files", () => {
		writeFileSync(join(root, "src", "a.ts"), "const a = 1;\n// TODO: handle errors\n// FIXME(bob) broken\n");
		writeFileSync(join(root, "node_modules", "dep", "x.js"), "// TODO ignored\n");
		writeFileSync(join(root, "bin.dat"), "TODO binary\0data");

		const items = findTodos(root);

		expect(items).toEqual([
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "handle errors" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "broken" },
		]);
	});

	it("formats an empty result and grouped results", () => {
		expect(formatTodos([])).toBe("No TODO or FIXME comments found.");
		const out = formatTodos([{ file: "src/a.ts", line: 2, tag: "TODO", text: "x" }]);
		expect(out).toContain("1 outstanding item");
		expect(out).toContain("**src/a.ts**");
	});
});
