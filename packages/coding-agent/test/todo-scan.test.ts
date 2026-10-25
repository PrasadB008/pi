import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoComments, scanTodoComments } from "../src/core/todo-scan.ts";

describe("todo scan", () => {
	let dir: string;

	beforeEach(() => {
		dir = join(tmpdir(), `todo-scan-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(join(dir, "src"), { recursive: true });
		mkdirSync(join(dir, "node_modules", "pkg"), { recursive: true });
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("registers /todos as a built-in command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todos")).toBe(true);
	});

	it("finds TODO and FIXME comments and skips ignored directories and binary files", async () => {
		writeFileSync(join(dir, "src", "a.ts"), "const a = 1;\n// TODO: handle errors\n// FIXME(bob) leak\n");
		writeFileSync(join(dir, "node_modules", "pkg", "index.js"), "// TODO: ignored\n");
		writeFileSync(join(dir, "blob.bin"), "TODO\0binary");

		const result = await scanTodoComments(dir);

		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "handle errors" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "bob) leak" },
		]);
	});

	it("truncates at maxResults and formats output", async () => {
		writeFileSync(join(dir, "src", "b.ts"), "// TODO one\n// TODO two\n// TODO three\n");

		const result = await scanTodoComments(dir, { maxResults: 2 });

		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
		const output = formatTodoComments(result);
		expect(output).toContain("**src/b.ts**");
		expect(output).toContain("- 1: TODO one");
		expect(output).toContain("Showing the first 2 results.");
	});

	it("reports when nothing is found", async () => {
		const result = await scanTodoComments(dir);
		expect(formatTodoComments(result)).toBe("No TODO or FIXME comments found.");
	});
});
