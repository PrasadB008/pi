import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodos, parseTodoLine, scanTodos } from "../src/core/todo-scanner.ts";

describe("parseTodoLine", () => {
	it("matches TODO and FIXME in common comment styles", () => {
		expect(parseTodoLine("// TODO: fix this")).toEqual({ tag: "TODO", text: "fix this" });
		expect(parseTodoLine("  # fixme handle errors")).toEqual({ tag: "FIXME", text: "handle errors" });
		expect(parseTodoLine("/* TODO(bob): later */")).toEqual({ tag: "TODO", text: "later" });
		expect(parseTodoLine(" * TODO document")).toEqual({ tag: "TODO", text: "document" });
		expect(parseTodoLine("<!-- TODO: markup -->")).toEqual({ tag: "TODO", text: "markup" });
	});

	it("ignores TODO outside comments and partial words", () => {
		expect(parseTodoLine("const todoList = []")).toBeUndefined();
		expect(parseTodoLine("const s = 'TODO'")).toBeUndefined();
		expect(parseTodoLine("// TODOS are tracked elsewhere")).toBeUndefined();
	});
});

describe("scanTodos", () => {
	let root: string;

	beforeEach(() => {
		root = join(tmpdir(), `todo-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(join(root, "src"), { recursive: true });
		mkdirSync(join(root, "node_modules", "pkg"), { recursive: true });
		mkdirSync(join(root, ".git"), { recursive: true });
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds items with relative paths and line numbers, sorted by file", () => {
		writeFileSync(join(root, "src", "b.ts"), "const a = 1;\n// TODO: second\n");
		writeFileSync(join(root, "src", "a.ts"), "// FIXME broken\n\n# TODO third\n");

		const result = scanTodos(root);

		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "src/a.ts", line: 1, tag: "FIXME", text: "broken" },
			{ file: "src/a.ts", line: 3, tag: "TODO", text: "third" },
			{ file: "src/b.ts", line: 2, tag: "TODO", text: "second" },
		]);
	});

	it("skips node_modules, .git and binary files", () => {
		writeFileSync(join(root, "node_modules", "pkg", "index.js"), "// TODO: vendored\n");
		writeFileSync(join(root, ".git", "config"), "# TODO: git\n");
		writeFileSync(join(root, "bin.dat"), "// TODO: binary\0data");
		writeFileSync(join(root, "keep.ts"), "// TODO: keep\n");

		const result = scanTodos(root);

		expect(result.items.map((i) => i.file)).toEqual(["keep.ts"]);
	});

	it("skips files larger than maxFileSize", () => {
		writeFileSync(join(root, "big.ts"), `// TODO: big\n${"x".repeat(100)}`);

		expect(scanTodos(root, { maxFileSize: 50 }).items).toEqual([]);
	});

	it("truncates at maxItems", () => {
		writeFileSync(join(root, "a.ts"), "// TODO: 1\n// TODO: 2\n// TODO: 3\n");

		const result = scanTodos(root, { maxItems: 2 });

		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});
});

describe("formatTodos", () => {
	it("reports when nothing is found", () => {
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO comments found.");
	});

	it("groups items by file and shows a count", () => {
		const text = formatTodos({
			items: [
				{ file: "a.ts", line: 1, tag: "TODO", text: "one" },
				{ file: "b.ts", line: 4, tag: "FIXME", text: "two" },
			],
			truncated: false,
		});

		expect(text).toContain("**a.ts**");
		expect(text).toContain("- 1: TODO one");
		expect(text).toContain("**b.ts**");
		expect(text).toContain("- 4: FIXME two");
		expect(text).toContain("2 items");
	});

	it("marks truncated output", () => {
		const text = formatTodos({ items: [{ file: "a.ts", line: 1, tag: "TODO", text: "x" }], truncated: true });

		expect(text).toContain("1+ item (truncated)");
	});
});

describe("/todo registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todo")).toBe(true);
	});
});
