import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodos, matchTodoLine, scanTodos } from "../src/utils/todo-scan.ts";

describe("matchTodoLine", () => {
	test("matches TODO and FIXME in common comment styles", () => {
		expect(matchTodoLine("const a = 1; // TODO: fix this")).toEqual({ tag: "TODO", text: "fix this" });
		expect(matchTodoLine("# FIXME handle error")).toEqual({ tag: "FIXME", text: "handle error" });
		expect(matchTodoLine("/* TODO(bob): cleanup */")).toEqual({ tag: "TODO", text: "cleanup" });
		expect(matchTodoLine(" * TODO document")).toEqual({ tag: "TODO", text: "document" });
		expect(matchTodoLine("<!-- TODO: link -->")).toEqual({ tag: "TODO", text: "link" });
	});

	test("ignores prose and identifiers", () => {
		expect(matchTodoLine("const todoList = [];")).toBeUndefined();
		expect(matchTodoLine("The TODO list is below")).toBeUndefined();
		expect(matchTodoLine("// TODOS are tracked elsewhere")).toBeUndefined();
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

	test("finds todos with relative paths and line numbers, sorted by path", () => {
		mkdirSync(join(root, "src"));
		writeFileSync(join(root, "src", "b.ts"), "const x = 1;\n// TODO: second\n");
		writeFileSync(join(root, "a.py"), "# FIXME first\n");

		const result = scanTodos(root);
		return result.then((r) => {
			expect(r.truncated).toBe(false);
			expect(r.items).toEqual([
				{ file: "a.py", line: 1, tag: "FIXME", text: "first" },
				{ file: "src/b.ts", line: 2, tag: "TODO", text: "second" },
			]);
		});
	});

	test("skips ignored directories and binary files", async () => {
		mkdirSync(join(root, "node_modules"));
		mkdirSync(join(root, ".git"));
		writeFileSync(join(root, "node_modules", "x.js"), "// TODO: dep\n");
		writeFileSync(join(root, ".git", "y"), "// TODO: git\n");
		writeFileSync(join(root, "bin.dat"), Buffer.from([0, 1, 2, 0x2f, 0x2f, 0x20, 0x54, 0x4f, 0x44, 0x4f]));

		const result = await scanTodos(root);
		expect(result.items).toEqual([]);
	});

	test("truncates at maxItems", async () => {
		writeFileSync(join(root, "a.ts"), "// TODO: 1\n// TODO: 2\n// TODO: 3\n");

		const result = await scanTodos(root, { maxItems: 2 });
		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});
});

describe("formatTodos", () => {
	test("reports when nothing is found", () => {
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO comments found.");
	});

	test("groups items by file and labels FIXME", () => {
		const output = formatTodos({
			items: [
				{ file: "a.ts", line: 1, tag: "TODO", text: "one" },
				{ file: "a.ts", line: 4, tag: "FIXME", text: "two" },
				{ file: "b.ts", line: 2, tag: "TODO", text: "" },
			],
			truncated: true,
		});
		expect(output).toBe(
			[
				"**a.ts**",
				"- L1: one",
				"- L4: FIXME: two",
				"",
				"**b.ts**",
				"- L2: (no description)",
				"",
				"Showing the first 3 items.",
			].join("\n"),
		);
	});
});

describe("/todo registration", () => {
	test("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
