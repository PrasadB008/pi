import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodos, parseTodoLine, scanTodos } from "../src/core/todo-scanner.ts";

describe("parseTodoLine", () => {
	it("matches markers after comment openers", () => {
		expect(parseTodoLine("// TODO: fix this")).toEqual({ tag: "TODO", text: "fix this" });
		expect(parseTodoLine("  # FIXME(bob) broken")).toEqual({ tag: "FIXME", text: "broken" });
		expect(parseTodoLine("/* HACK remove later */")).toEqual({ tag: "HACK", text: "remove later" });
		expect(parseTodoLine(" * XXX check")).toEqual({ tag: "XXX", text: "check" });
		expect(parseTodoLine("<!-- TODO: docs -->")).toEqual({ tag: "TODO", text: "docs" });
	});

	it("ignores markers outside comments and partial words", () => {
		expect(parseTodoLine('const s = "TODO list";')).toBeUndefined();
		expect(parseTodoLine("// TODOS are tracked elsewhere")).toBeUndefined();
		expect(parseTodoLine("const x = 1;")).toBeUndefined();
	});
});

describe("scanTodos", () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "pi-todo-"));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds todos with file and line, sorted by path", () => {
		mkdirSync(join(root, "src"));
		writeFileSync(join(root, "b.ts"), "const a = 1;\n// TODO: second\n");
		writeFileSync(join(root, "src", "a.ts"), "// FIXME first\n");
		const items = scanTodos(root);
		return items.then((result) => {
			expect(result).toEqual([
				{ file: "b.ts", line: 2, tag: "TODO", text: "second" },
				{ file: "src/a.ts", line: 1, tag: "FIXME", text: "first" },
			]);
		});
	});

	it("skips ignored directories and binary files", async () => {
		mkdirSync(join(root, "node_modules"));
		mkdirSync(join(root, ".git"));
		writeFileSync(join(root, "node_modules", "x.js"), "// TODO: dep\n");
		writeFileSync(join(root, ".git", "x"), "# TODO: git\n");
		writeFileSync(join(root, "bin.dat"), Buffer.from([0, 1, 2, 0x2f, 0x2f, 0x20, 0x54, 0x4f, 0x44, 0x4f]));
		expect(await scanTodos(root)).toEqual([]);
	});

	it("respects the limit", async () => {
		writeFileSync(join(root, "a.ts"), "// TODO 1\n// TODO 2\n// TODO 3\n");
		expect(await scanTodos(root, { limit: 2 })).toHaveLength(2);
	});
});

describe("formatTodos", () => {
	it("reports when nothing is found", () => {
		expect(formatTodos([])).toBe("No TODO comments found.");
	});

	it("groups items by file", () => {
		const out = formatTodos([
			{ file: "a.ts", line: 1, tag: "TODO", text: "one" },
			{ file: "a.ts", line: 5, tag: "FIXME", text: "two" },
			{ file: "b.ts", line: 2, tag: "TODO", text: "" },
		]);
		expect(out).toBe("3 TODO comments\n\na.ts\n  1: TODO one\n  5: FIXME two\n\nb.ts\n  2: TODO");
	});
});

describe("/todo registration", () => {
	it("is a builtin slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todo")).toBe(true);
	});
});
