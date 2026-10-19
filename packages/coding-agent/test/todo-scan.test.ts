import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodos, matchTodoLine, scanTodos } from "../src/core/todo-scan.ts";

describe("matchTodoLine", () => {
	it("matches TODO and FIXME in common comment styles", () => {
		expect(matchTodoLine("const a = 1; // TODO: fix this")).toEqual({ tag: "TODO", text: "fix this" });
		expect(matchTodoLine("# FIXME handle errors")).toEqual({ tag: "FIXME", text: "handle errors" });
		expect(matchTodoLine("/* TODO(alice): cleanup */")).toEqual({ tag: "TODO", text: "alice): cleanup" });
		expect(matchTodoLine(" * TODO document")).toEqual({ tag: "TODO", text: "document" });
		expect(matchTodoLine("<!-- TODO: markup -->")).toEqual({ tag: "TODO", text: "markup" });
	});

	it("ignores lines without a comment marker or with other words", () => {
		expect(matchTodoLine("const todo = 1;")).toBeUndefined();
		expect(matchTodoLine("// TODOS are listed elsewhere")).toBeUndefined();
		expect(matchTodoLine('const s = "TODO";')).toBeUndefined();
	});
});

describe("scanTodos", () => {
	let root: string;

	beforeEach(() => {
		root = join(tmpdir(), `todo-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(join(root, "src"), { recursive: true });
		mkdirSync(join(root, "node_modules", "dep"), { recursive: true });
		mkdirSync(join(root, ".git"), { recursive: true });
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds todos with relative paths and line numbers, sorted by path", () => {
		writeFileSync(join(root, "src", "b.ts"), "const x = 1;\n// TODO: second\n");
		writeFileSync(join(root, "a.py"), "# FIXME first\n");
		const { items, truncated } = scanTodos(root);
		expect(truncated).toBe(false);
		expect(items).toEqual([
			{ file: "a.py", line: 1, tag: "FIXME", text: "first" },
			{ file: "src/b.ts", line: 2, tag: "TODO", text: "second" },
		]);
	});

	it("skips node_modules, .git and binary files", () => {
		writeFileSync(join(root, "node_modules", "dep", "index.js"), "// TODO: dependency\n");
		writeFileSync(join(root, ".git", "config"), "# TODO: git\n");
		writeFileSync(join(root, "image.bin"), Buffer.from([0, 1, 2, 0x2f, 0x2f, 0x20, 0x54, 0x4f, 0x44, 0x4f]));
		expect(scanTodos(root).items).toEqual([]);
	});

	it("truncates at the limit", () => {
		writeFileSync(join(root, "many.ts"), "// TODO: 1\n// TODO: 2\n// TODO: 3\n");
		const { items, truncated } = scanTodos(root, 2);
		expect(items).toHaveLength(2);
		expect(truncated).toBe(true);
	});
});

describe("formatTodos", () => {
	it("reports when nothing is found", () => {
		expect(formatTodos([], false)).toBe("No TODO comments found.");
	});

	it("groups items by file and shows a count", () => {
		const output = formatTodos(
			[
				{ file: "a.ts", line: 1, tag: "TODO", text: "one" },
				{ file: "a.ts", line: 5, tag: "FIXME", text: "two" },
				{ file: "b.ts", line: 2, tag: "TODO", text: "" },
			],
			true,
		);
		expect(output).toBe("a.ts\n  1: TODO one\n  5: FIXME two\nb.ts\n  2: TODO\n\n3 items (truncated)");
	});
});

describe("/todo slash command", () => {
	it("is registered as a built-in command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
