import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodos, matchTodoLine, scanTodos } from "../src/core/todo-scan.ts";

describe("matchTodoLine", () => {
	it("matches TODO and FIXME in common comment styles", () => {
		expect(matchTodoLine("const a = 1; // TODO: handle errors")).toEqual({ tag: "TODO", text: "handle errors" });
		expect(matchTodoLine("# FIXME broken on windows")).toEqual({ tag: "FIXME", text: "broken on windows" });
		expect(matchTodoLine("/* TODO(me): tidy up */")).toEqual({ tag: "TODO", text: "me): tidy up" });
		expect(matchTodoLine(" * TODO document this")).toEqual({ tag: "TODO", text: "document this" });
		expect(matchTodoLine("<!-- TODO: add docs -->")).toEqual({ tag: "TODO", text: "add docs" });
	});

	it("ignores lines without a whole-word marker in a comment", () => {
		expect(matchTodoLine("const todo = 1;")).toBeUndefined();
		expect(matchTodoLine("// TODOS are tracked elsewhere")).toBeUndefined();
		expect(matchTodoLine("const TODO = 1;")).toBeUndefined();
	});
});

describe("scanTodos", () => {
	let dir: string;

	beforeEach(() => {
		dir = join(tmpdir(), `todo-scan-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(dir, { recursive: true });
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("finds todos with file and line numbers, sorted by path", () => {
		mkdirSync(join(dir, "src"));
		writeFileSync(join(dir, "src", "b.ts"), "export {};\n// TODO: second\n");
		writeFileSync(join(dir, "a.py"), "x = 1\ny = 2\n# FIXME first\n");

		const result = scanTodos(dir);
		return result.then(({ items, truncated }) => {
			expect(truncated).toBe(false);
			expect(items).toEqual([
				{ file: "a.py", line: 3, tag: "FIXME", text: "first" },
				{ file: "src/b.ts", line: 2, tag: "TODO", text: "second" },
			]);
		});
	});

	it("skips node_modules and binary files", async () => {
		mkdirSync(join(dir, "node_modules", "pkg"), { recursive: true });
		writeFileSync(join(dir, "node_modules", "pkg", "index.js"), "// TODO: vendored\n");
		writeFileSync(join(dir, "image.bin"), "\0// TODO: binary\n");
		writeFileSync(join(dir, "real.ts"), "// TODO: real\n");

		const { items } = await scanTodos(dir);
		expect(items.map((item) => item.file)).toEqual(["real.ts"]);
	});

	it("truncates at maxItems", async () => {
		writeFileSync(join(dir, "many.ts"), "// TODO: 1\n// TODO: 2\n// TODO: 3\n");
		const result = await scanTodos(dir, { maxItems: 2 });
		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});
});

describe("formatTodos", () => {
	it("reports when nothing is found", () => {
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO comments found.");
	});

	it("groups items by file", () => {
		const output = formatTodos({
			items: [
				{ file: "a.ts", line: 1, tag: "TODO", text: "one" },
				{ file: "a.ts", line: 4, tag: "FIXME", text: "two" },
				{ file: "b.ts", line: 2, tag: "TODO", text: "" },
			],
			truncated: false,
		});
		expect(output).toBe(
			["3 TODO comment(s)", "", "**a.ts**", "- 1: TODO one", "- 4: FIXME two", "", "**b.ts**", "- 2: TODO"].join("\n"),
		);
	});
});

describe("/todo registration", () => {
	it("is a builtin slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
