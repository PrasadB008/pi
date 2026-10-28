import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { findTodos, groupTodosByFile, parseTodoOutput } from "../src/core/todos.ts";

describe("todos", () => {
	describe("parseTodoOutput", () => {
		it("parses git grep lines and trims text", () => {
			const result = parseTodoOutput("src/a.ts:12:\t// TODO: fix this\nsrc/b.ts:3:  FIXME later\n");
			expect(result.truncated).toBe(false);
			expect(result.matches).toEqual([
				{ file: "src/a.ts", line: 12, text: "// TODO: fix this" },
				{ file: "src/b.ts", line: 3, text: "FIXME later" },
			]);
		});

		it("caps matches and reports truncation", () => {
			const output = "a.ts:1:TODO\na.ts:2:TODO\na.ts:3:TODO\n";
			const result = parseTodoOutput(output, 2);
			expect(result.matches).toHaveLength(2);
			expect(result.truncated).toBe(true);
		});

		it("does not report truncation when exactly at the limit", () => {
			const result = parseTodoOutput("a.ts:1:TODO\na.ts:2:TODO\n", 2);
			expect(result.matches).toHaveLength(2);
			expect(result.truncated).toBe(false);
		});
	});

	describe("groupTodosByFile", () => {
		it("groups matches by file in first-seen order", () => {
			const groups = groupTodosByFile([
				{ file: "b.ts", line: 1, text: "TODO" },
				{ file: "a.ts", line: 2, text: "TODO" },
				{ file: "b.ts", line: 5, text: "FIXME" },
			]);
			expect([...groups.keys()]).toEqual(["b.ts", "a.ts"]);
			expect(groups.get("b.ts")?.map((m) => m.line)).toEqual([1, 5]);
		});
	});

	describe("findTodos", () => {
		let dir: string;

		beforeEach(() => {
			dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-todos-"));
			execFileSync("git", ["init", "-q"], { cwd: dir });
		});

		afterEach(() => {
			fs.rmSync(dir, { recursive: true, force: true });
		});

		it("finds TODO and FIXME in untracked files and skips ignored files", async () => {
			fs.writeFileSync(path.join(dir, ".gitignore"), "ignored.txt\n");
			fs.writeFileSync(path.join(dir, "a.ts"), "const x = 1;\n// TODO: first\n// FIXME: second\n");
			fs.writeFileSync(path.join(dir, "ignored.txt"), "TODO: hidden\n");
			const result = await findTodos(dir);
			expect(result.matches.map((m) => `${m.file}:${m.line}`)).toEqual(["a.ts:2", "a.ts:3"]);
		});

		it("returns no matches when nothing is found", async () => {
			fs.writeFileSync(path.join(dir, "a.ts"), "const x = 1;\n");
			const result = await findTodos(dir);
			expect(result.matches).toEqual([]);
		});
	});

	it("registers the /todos builtin command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todos")).toBe(true);
	});
});
