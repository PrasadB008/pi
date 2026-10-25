import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTodos, formatTodos, parseTodoLine } from "../src/core/todos.ts";

describe("todos", () => {
	let dir: string;

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		fs.rmSync(dir, { recursive: true, force: true });
	});

	it("parses TODO and FIXME only inside comments", () => {
		expect(parseTodoLine("const x = 1; // TODO: fix this")).toEqual({ tag: "TODO", text: "fix this" });
		expect(parseTodoLine("# FIXME(bob): broken")).toEqual({ tag: "FIXME", text: "broken" });
		expect(parseTodoLine("const s = 'TODO';")).toBeUndefined();
	});

	it("finds todos, skipping ignored directories", () => {
		fs.mkdirSync(path.join(dir, "src"));
		fs.mkdirSync(path.join(dir, "node_modules"));
		fs.writeFileSync(path.join(dir, "src", "a.ts"), "const a = 1;\n// TODO: first\n");
		fs.writeFileSync(path.join(dir, "node_modules", "b.js"), "// TODO: ignored\n");

		const result = findTodos(dir);
		expect(result.items).toEqual([{ file: "src/a.ts", line: 2, tag: "TODO", text: "first" }]);
		expect(formatTodos(result)).toContain("**src/a.ts**");
	});

	it("truncates at maxItems", () => {
		fs.writeFileSync(path.join(dir, "a.ts"), "// TODO: one\n// TODO: two\n");
		const result = findTodos(dir, { maxItems: 1 });
		expect(result.items).toHaveLength(1);
		expect(result.truncated).toBe(true);
	});
});
