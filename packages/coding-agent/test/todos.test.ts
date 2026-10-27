import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findTodos, formatTodos, parseTodoLines } from "../src/core/todos.ts";

describe("todos", () => {
	const dirs: string[] = [];
	afterEach(() => {
		for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
	});

	it("parses git grep output", () => {
		const items = parseTodoLines("a.ts:3:// TODO: fix this\nb.ts:10:/* FIXME(x) broken */\nc.ts:1:no match");
		expect(items).toEqual([
			{ file: "a.ts", line: 3, tag: "TODO", text: "fix this" },
			{ file: "b.ts", line: 10, tag: "FIXME", text: "broken" },
		]);
	});

	it("formats grouped output and the empty case", () => {
		const text = formatTodos([
			{ file: "a.ts", line: 3, tag: "TODO", text: "one" },
			{ file: "a.ts", line: 9, tag: "FIXME", text: "two" },
		]);
		expect(text).toBe("2 outstanding in 1 file\n\na.ts (2)\n  3: TODO one\n  9: FIXME two");
		expect(formatTodos([])).toBe("No TODO or FIXME comments found.");
	});

	it("finds todos in a repo and skips ignored files", async () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		dirs.push(dir);
		execFileSync("git", ["init", "-q"], { cwd: dir });
		writeFileSync(join(dir, ".gitignore"), "ignored.ts\n");
		writeFileSync(join(dir, "src.ts"), "const a = 1;\n// TODO: later\n");
		writeFileSync(join(dir, "ignored.ts"), "// TODO: hidden\n");
		const items = await findTodos(dir);
		expect(items).toEqual([{ file: "src.ts", line: 2, tag: "TODO", text: "later" }]);
	});

	it("rejects outside a git repository", async () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		dirs.push(dir);
		await expect(findTodos(dir)).rejects.toThrow(/git/);
	});
});
