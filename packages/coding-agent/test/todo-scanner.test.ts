import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodosMarkdown, parseTodoLine, scanTodos } from "../src/core/todo-scanner.ts";

describe("parseTodoLine", () => {
	it("parses common comment styles", () => {
		expect(parseTodoLine("const a = 1; // TODO: fix this")).toEqual({ tag: "TODO", text: "fix this" });
		expect(parseTodoLine("# FIXME(bob) handle errors")).toEqual({ tag: "FIXME", text: "handle errors" });
		expect(parseTodoLine("/* TODO tidy up */")).toEqual({ tag: "TODO", text: "tidy up" });
		expect(parseTodoLine(" * TODO: document")).toEqual({ tag: "TODO", text: "document" });
		expect(parseTodoLine("<!-- TODO: update docs -->")).toEqual({ tag: "TODO", text: "update docs" });
	});

	it("ignores lines that are not TODO comments", () => {
		expect(parseTodoLine("const todo = 1;")).toBeUndefined();
		expect(parseTodoLine("// todo lowercase is ignored")).toBeUndefined();
		expect(parseTodoLine("const s = 'TODO';")).toBeUndefined();
		expect(parseTodoLine("// TODOS are not markers")).toBeUndefined();
	});
});

describe("scanTodos", () => {
	let root: string;

	const write = (relPath: string, content: string | Buffer) => {
		const full = join(root, relPath);
		mkdirSync(dirname(full), { recursive: true });
		writeFileSync(full, content);
	};

	beforeEach(() => {
		root = join(tmpdir(), `todo-scan-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(root, { recursive: true });
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds TODOs with relative paths and line numbers, sorted by file", () => {
		write("src/b.ts", "line\n// TODO: second file\n");
		write("a.ts", "// FIXME broken\nok\n// TODO: later\n");

		const { items, truncated } = scanTodos(root);

		expect(truncated).toBe(false);
		expect(items).toEqual([
			{ file: "a.ts", line: 1, tag: "FIXME", text: "broken" },
			{ file: "a.ts", line: 3, tag: "TODO", text: "later" },
			{ file: "src/b.ts", line: 2, tag: "TODO", text: "second file" },
		]);
	});

	it("skips ignored directories, binary files and oversized files", () => {
		write("node_modules/pkg/index.js", "// TODO: dependency\n");
		write(".git/info.txt", "# TODO: git internals\n");
		write("image.bin", Buffer.from([0, 1, 2, 0x2f, 0x2f, 0x20, 0x54, 0x4f, 0x44, 0x4f]));
		write("big.ts", `// TODO: big\n${"x".repeat(200)}`);
		write("kept.ts", "// TODO: kept\n");

		const { items } = scanTodos(root, { maxFileBytes: 100 });

		expect(items.map((item) => item.file)).toEqual(["kept.ts"]);
	});

	it("truncates at maxItems", () => {
		write("a.ts", "// TODO: 1\n// TODO: 2\n// TODO: 3\n");

		const { items, truncated } = scanTodos(root, { maxItems: 2 });

		expect(items).toHaveLength(2);
		expect(truncated).toBe(true);
	});

	it("returns nothing for a missing directory", () => {
		expect(scanTodos(join(root, "missing"))).toEqual({ items: [], truncated: false });
	});
});

describe("formatTodosMarkdown", () => {
	it("reports when nothing was found", () => {
		expect(formatTodosMarkdown({ items: [], truncated: false })).toBe("No TODO comments found.");
	});

	it("groups items by file and notes truncation", () => {
		const output = formatTodosMarkdown({
			items: [
				{ file: "a.ts", line: 1, tag: "TODO", text: "one" },
				{ file: "a.ts", line: 4, tag: "FIXME", text: "two" },
				{ file: "b.ts", line: 2, tag: "TODO", text: "three" },
			],
			truncated: true,
		});

		expect(output).toBe(
			[
				"**a.ts**",
				"",
				"- `1` TODO one",
				"- `4` FIXME two",
				"",
				"**b.ts**",
				"",
				"- `2` TODO three",
				"",
				"Showing the first 3 items.",
			].join("\n"),
		);
	});
});

describe("/todo slash command", () => {
	it("is registered as a built-in command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
