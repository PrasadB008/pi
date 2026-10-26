import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseTodoLine, scanTodos } from "../src/core/todos.ts";

describe("parseTodoLine", () => {
	it("extracts the tag and text from comments", () => {
		expect(parseTodoLine("// TODO: handle errors")).toEqual({ tag: "TODO", text: "handle errors" });
		expect(parseTodoLine("# FIXME(alice) broken on windows")).toEqual({ tag: "FIXME", text: "broken on windows" });
		expect(parseTodoLine("/* HACK: workaround */")).toEqual({ tag: "HACK", text: "workaround" });
	});

	it("ignores lines without an upper-case marker word", () => {
		expect(parseTodoLine("const todoList = []")).toBeUndefined();
		expect(parseTodoLine("// todo later")).toBeUndefined();
		expect(parseTodoLine("const TODOS = 1")).toBeUndefined();
	});
});

describe("scanTodos", () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("finds todos with file and line, skipping node_modules and binary files", async () => {
		mkdirSync(join(dir, "src"));
		mkdirSync(join(dir, "node_modules"));
		writeFileSync(join(dir, "src", "a.ts"), "const a = 1;\n// TODO: first\n\n// FIXME second\n");
		writeFileSync(join(dir, "b.txt"), "XXX: third\n");
		writeFileSync(join(dir, "node_modules", "dep.js"), "// TODO: ignored\n");
		writeFileSync(join(dir, "image.bin"), Buffer.from([0, 1, 2, ...Buffer.from("TODO: binary")]));

		const result = await scanTodos(dir);

		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "b.txt", line: 1, tag: "XXX", text: "third" },
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "first" },
			{ file: "src/a.ts", line: 4, tag: "FIXME", text: "second" },
		]);
	});

	it("truncates at maxItems", async () => {
		writeFileSync(join(dir, "a.txt"), "TODO: one\nTODO: two\nTODO: three\n");

		const result = await scanTodos(dir, { maxItems: 2 });

		expect(result.items.map((item) => item.text)).toEqual(["one", "two"]);
		expect(result.truncated).toBe(true);
	});

	it("returns nothing for a directory without todos", async () => {
		writeFileSync(join(dir, "a.txt"), "nothing here\n");

		expect(await scanTodos(dir)).toEqual({ items: [], truncated: false });
	});
});
