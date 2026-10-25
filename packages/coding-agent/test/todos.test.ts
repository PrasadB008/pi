import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { findTodos, formatTodosMarkdown, parseTodoLines } from "../src/core/todos.ts";

describe("parseTodoLines", () => {
	test("parses git grep output and ignores non-matching lines", () => {
		const output = [
			"src/a.ts:12:\t// TODO: handle errors",
			"src/b.ts:3:/* FIXME broken */",
			"src/c.ts:5:const TODOS = []",
			"",
		].join("\n");

		expect(parseTodoLines(output)).toEqual([
			{ file: "src/a.ts", line: 12, tag: "TODO", text: "// TODO: handle errors" },
			{ file: "src/b.ts", line: 3, tag: "FIXME", text: "/* FIXME broken */" },
		]);
	});
});

describe("formatTodosMarkdown", () => {
	test("reports when there are no todos", () => {
		expect(formatTodosMarkdown([])).toBe("No TODO or FIXME comments found.");
	});

	test("groups items by file", () => {
		const markdown = formatTodosMarkdown([
			{ file: "a.ts", line: 1, tag: "TODO", text: "// TODO one" },
			{ file: "a.ts", line: 2, tag: "TODO", text: "// TODO two" },
			{ file: "b.ts", line: 9, tag: "FIXME", text: "// FIXME three" },
		]);

		expect(markdown).toContain("3 outstanding in 2 files");
		expect(markdown).toContain("**a.ts**\n- `1` // TODO one\n- `2` // TODO two");
		expect(markdown).toContain("**b.ts**\n- `9` // FIXME three");
	});
});

describe("findTodos", () => {
	const dirs: string[] = [];

	afterEach(() => {
		for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
	});

	function makeRepo(): string {
		const dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		dirs.push(dir);
		execFileSync("git", ["init", "-q"], { cwd: dir });
		return dir;
	}

	test("finds todos in tracked and untracked files but skips ignored files", async () => {
		const dir = makeRepo();
		mkdirSync(join(dir, "src"));
		writeFileSync(join(dir, ".gitignore"), "ignored.ts\n");
		writeFileSync(join(dir, "src", "a.ts"), "const x = 1;\n// TODO: first\n");
		writeFileSync(join(dir, "ignored.ts"), "// TODO: hidden\n");

		const result = await findTodos(dir);

		expect(result.error).toBeUndefined();
		expect(result.items).toEqual([{ file: "src/a.ts", line: 2, tag: "TODO", text: "// TODO: first" }]);
	});

	test("returns no items for a repo without todos", async () => {
		const dir = makeRepo();
		writeFileSync(join(dir, "a.ts"), "const x = 1;\n");

		expect(await findTodos(dir)).toEqual({ items: [] });
	});

	test("reports an error outside a git repository", async () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-todos-nogit-"));
		dirs.push(dir);
		writeFileSync(join(dir, "a.ts"), "// TODO: x\n");

		const result = await findTodos(dir);

		expect(result.items).toEqual([]);
		expect(result.error).toContain("Could not scan for TODOs");
	});
});
