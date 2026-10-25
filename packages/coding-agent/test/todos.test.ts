import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { findTodos, formatTodos } from "../src/core/todos.ts";

describe("findTodos", () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "todos-test-"));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds TODO and FIXME comments with file and line", () => {
		mkdirSync(join(root, "src"));
		writeFileSync(join(root, "src", "a.ts"), "const a = 1;\n// TODO: handle errors\n// FIXME(bob) broken\n");
		const items = findTodos(root);
		expect(items).toEqual([
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "handle errors" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "broken" },
		]);
	});

	it("skips ignored directories and binary files", () => {
		mkdirSync(join(root, "node_modules"));
		writeFileSync(join(root, "node_modules", "x.js"), "// TODO ignored\n");
		writeFileSync(join(root, "bin.dat"), Buffer.from([0, 1, 2, 0x54, 0x4f, 0x44, 0x4f]));
		writeFileSync(join(root, "b.ts"), "// TODO real\n");
		expect(findTodos(root).map((i) => i.file)).toEqual(["b.ts"]);
	});

	it("respects maxItems", () => {
		writeFileSync(join(root, "c.ts"), "// TODO 1\n// TODO 2\n// TODO 3\n");
		expect(findTodos(root, { maxItems: 2 })).toHaveLength(2);
	});
});

describe("formatTodos", () => {
	it("reports when nothing is found", () => {
		expect(formatTodos([])).toBe("No TODO or FIXME comments found.");
	});

	it("groups items by file", () => {
		const out = formatTodos([
			{ file: "a.ts", line: 1, tag: "TODO", text: "x" },
			{ file: "a.ts", line: 4, tag: "FIXME", text: "y" },
		]);
		expect(out).toContain("2 outstanding items");
		expect(out.match(/### a\.ts/g)).toHaveLength(1);
	});
});

describe("/todos registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todos")).toBe(true);
	});
});
