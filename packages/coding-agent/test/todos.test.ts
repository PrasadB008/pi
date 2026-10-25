import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { findTodos, formatTodos, parseTodoLine } from "../src/core/todos.ts";

describe("todos", () => {
	let dir: string | undefined;

	afterEach(() => {
		if (dir) rmSync(dir, { recursive: true, force: true });
		dir = undefined;
	});

	it("registers the /todos built-in command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todos")).toBe(true);
	});

	it("parses TODO comments only", () => {
		expect(parseTodoLine("// TODO: fix this")).toBe("fix this");
		expect(parseTodoLine("# TODO(bob) tidy")).toBe("tidy");
		expect(parseTodoLine("/* TODO handle error */")).toBe("handle error");
		expect(parseTodoLine("const todos = []")).toBeUndefined();
		expect(parseTodoLine("const x = 'TODO';")).toBeUndefined();
	});

	it("finds TODOs and skips node_modules", async () => {
		dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		mkdirSync(join(dir, "src"));
		mkdirSync(join(dir, "node_modules"));
		writeFileSync(join(dir, "src", "a.ts"), "const a = 1;\n// TODO: first\n");
		writeFileSync(join(dir, "node_modules", "b.ts"), "// TODO: ignored\n");

		const result = await findTodos(dir);
		expect(result.items).toEqual([{ file: "src/a.ts", line: 2, text: "first" }]);
		expect(formatTodos(result)).toContain("`src/a.ts:2` first");
	});

	it("truncates at maxResults", async () => {
		dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		writeFileSync(join(dir, "a.ts"), "// TODO: 1\n// TODO: 2\n// TODO: 3\n");
		const result = await findTodos(dir, { maxResults: 2 });
		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});

	it("reports when nothing is found", async () => {
		dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		expect(formatTodos(await findTodos(dir))).toBe("No TODO comments found.");
	});
});
