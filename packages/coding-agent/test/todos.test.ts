import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { findTodos, parseTodoLine } from "../src/utils/todos.ts";

describe("parseTodoLine", () => {
	it("matches TODO and FIXME after comment tokens", () => {
		expect(parseTodoLine("// TODO: handle errors")).toEqual({ tag: "TODO", text: "handle errors" });
		expect(parseTodoLine("  # FIXME(bob) broken")).toEqual({ tag: "FIXME", text: "(bob) broken" });
		expect(parseTodoLine("/* TODO tidy up */")).toEqual({ tag: "TODO", text: "tidy up" });
		expect(parseTodoLine(" * TODO: in jsdoc")).toEqual({ tag: "TODO", text: "in jsdoc" });
	});

	it("ignores prose that is not a comment marker", () => {
		expect(parseTodoLine("const todos = []")).toBeUndefined();
		expect(parseTodoLine("list all TODO items")).toBeUndefined();
		expect(parseTodoLine("// TODOS are tracked elsewhere")).toBeUndefined();
	});
});

describe("findTodos", () => {
	let root: string;

	beforeEach(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		fs.rmSync(root, { recursive: true, force: true });
	});

	function write(relative: string, content: string | Buffer): void {
		const full = path.join(root, relative);
		fs.mkdirSync(path.dirname(full), { recursive: true });
		fs.writeFileSync(full, content);
	}

	it("finds todos with relative paths and line numbers, skipping ignored and binary files", async () => {
		write("src/a.ts", "const a = 1;\n// TODO: first\nconst b = 2; // FIXME second\n");
		write("src/nested/b.py", "# TODO python\n");
		write("node_modules/dep/index.js", "// TODO should be skipped\n");
		write("bin.dat", Buffer.from("// TODO binary\0data"));

		const { items, truncated } = await findTodos(root);

		expect(truncated).toBe(false);
		expect(items).toEqual([
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "first" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "second" },
			{ file: "src/nested/b.py", line: 1, tag: "TODO", text: "python" },
		]);
	});

	it("reports truncation when the item limit is reached", async () => {
		write("a.ts", "// TODO one\n// TODO two\n// TODO three\n");

		const { items, truncated } = await findTodos(root, { maxItems: 2 });

		expect(items).toHaveLength(2);
		expect(truncated).toBe(true);
	});

	it("returns nothing for a directory without todos", async () => {
		write("a.ts", "export const a = 1;\n");

		expect(await findTodos(root)).toEqual({ items: [], truncated: false });
	});
});

describe("/todos registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todos")).toBe(true);
	});
});
