import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { findTodos, formatTodosMarkdown } from "../src/core/todos.ts";

describe("findTodos", () => {
	let dir: string;

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		fs.rmSync(dir, { recursive: true, force: true });
	});

	it("registers /todos as a built-in command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todos")).toBe(true);
	});

	it("finds TODO and FIXME comments with file, line and text, skipping node_modules and binaries", () => {
		fs.mkdirSync(path.join(dir, "src"));
		fs.mkdirSync(path.join(dir, "node_modules"));
		fs.writeFileSync(path.join(dir, "src", "a.ts"), "const a = 1;\n// TODO: handle errors\n// FIXME(bob) broken\n");
		fs.writeFileSync(path.join(dir, "node_modules", "dep.js"), "// TODO ignored\n");
		fs.writeFileSync(path.join(dir, "bin.dat"), Buffer.from([0, 1, 2, 84, 79, 68, 79]));
		fs.writeFileSync(path.join(dir, "notes.md"), "TODOS are fine\nnothing here\n");

		const result = findTodos(dir);

		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "handle errors" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "broken" },
		]);
	});

	it("truncates at maxItems", () => {
		fs.writeFileSync(path.join(dir, "a.ts"), "// TODO one\n// TODO two\n// TODO three\n");

		const result = findTodos(dir, 2);

		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});

	it("formats results grouped by file, and an empty result", () => {
		const markdown = formatTodosMarkdown({
			items: [{ file: "src/a.ts", line: 2, tag: "TODO", text: "handle errors" }],
			truncated: false,
		});
		expect(markdown).toContain("1 outstanding item in 1 file");
		expect(markdown).toContain("### src/a.ts");
		expect(markdown).toContain("**TODO** handle errors");

		expect(formatTodosMarkdown({ items: [], truncated: false })).toBe("No TODO or FIXME comments found.");
	});
});
