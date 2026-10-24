import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatTodos, parseTodoLine, scanTodos } from "../src/core/todo-scanner.ts";

describe("parseTodoLine", () => {
	it("matches comment markers and strips trailing comment terminators", () => {
		expect(parseTodoLine("// TODO: fix this")).toEqual({ tag: "TODO", text: "fix this" });
		expect(parseTodoLine("# FIXME(bob) handle error")).toEqual({ tag: "FIXME", text: "handle error" });
		expect(parseTodoLine("/* HACK remove later */")).toEqual({ tag: "HACK", text: "remove later" });
		expect(parseTodoLine("<!-- TODO docs -->")).toEqual({ tag: "TODO", text: "docs" });
	});

	it("ignores identifiers and prose that are not comment markers", () => {
		expect(parseTodoLine("const todo = 1;")).toBeUndefined();
		expect(parseTodoLine("const TODOS = [];")).toBeUndefined();
		expect(parseTodoLine("// todos are listed elsewhere")).toBeUndefined();
	});
});

describe("scanTodos", () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "todo-scan-"));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds todos with relative paths and line numbers, skipping ignored dirs and binary files", async () => {
		mkdirSync(join(root, "src"));
		mkdirSync(join(root, "node_modules"));
		writeFileSync(join(root, "src", "a.ts"), "const x = 1;\n// TODO: first\n// FIXME second\n");
		writeFileSync(join(root, "node_modules", "b.ts"), "// TODO: ignored\n");
		writeFileSync(join(root, "bin.dat"), Buffer.from([0, 1, 2, 0x2f, 0x2f, 0x20, 0x54, 0x4f, 0x44, 0x4f]));

		const result = await scanTodos(root);

		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "first" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "second" },
		]);
	});

	it("truncates at maxItems", async () => {
		writeFileSync(join(root, "a.ts"), "// TODO: 1\n// TODO: 2\n// TODO: 3\n");

		const result = await scanTodos(root, { maxItems: 2 });

		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});
});

describe("formatTodos", () => {
	it("reports when nothing was found", () => {
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO comments found.");
	});

	it("groups items by file", () => {
		const out = formatTodos({
			items: [
				{ file: "a.ts", line: 1, tag: "TODO", text: "one" },
				{ file: "a.ts", line: 5, tag: "FIXME", text: "two" },
				{ file: "b.ts", line: 2, tag: "TODO", text: "three" },
			],
			truncated: false,
		});
		expect(out).toContain("3 items in 2 files");
		expect(out).toContain("### a.ts");
		expect(out).toContain("### b.ts");
	});
});
