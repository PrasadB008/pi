import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { findTodos, formatTodos, MAX_TODO_MATCHES, parseTodoOutput } from "../src/core/todos.ts";

describe("parseTodoOutput", () => {
	test("parses git grep rows and ignores non-matching lines", () => {
		const output = ["src/a.ts:3:// TODO: fix this", "src/b.ts:10:  /* FIXME handle null */", "garbage", ""].join(
			"\n",
		);
		expect(parseTodoOutput(output)).toEqual([
			{ file: "src/a.ts", line: 3, marker: "TODO", text: "// TODO: fix this" },
			{ file: "src/b.ts", line: 10, marker: "FIXME", text: "/* FIXME handle null */" },
		]);
	});
});

describe("formatTodos", () => {
	test("reports when nothing was found", () => {
		expect(formatTodos({ matches: [], truncated: false })).toBe("No TODO or FIXME comments found.");
	});

	test("groups matches by file", () => {
		const text = formatTodos({
			matches: [
				{ file: "a.ts", line: 1, marker: "TODO", text: "// TODO one" },
				{ file: "a.ts", line: 5, marker: "FIXME", text: "// FIXME two" },
				{ file: "b.ts", line: 2, marker: "TODO", text: "// TODO three" },
			],
			truncated: false,
		});
		expect(text).toBe(
			[
				"a.ts",
				"  1: // TODO one",
				"  5: // FIXME two",
				"b.ts",
				"  2: // TODO three",
				"",
				"3 matches in 2 files.",
			].join("\n"),
		);
	});
});

describe("findTodos", () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		execFileSync("git", ["init", "-q"], { cwd: dir });
		writeFileSync(join(dir, ".gitignore"), "ignored.ts\n");
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	test("finds tracked and untracked markers and skips ignored files", async () => {
		mkdirSync(join(dir, "src"));
		writeFileSync(join(dir, "src", "tracked.ts"), "const a = 1;\n// TODO tracked\n");
		execFileSync("git", ["add", "src/tracked.ts"], { cwd: dir });
		writeFileSync(join(dir, "untracked.ts"), "// FIXME untracked\n");
		writeFileSync(join(dir, "ignored.ts"), "// TODO ignored\n");

		const result = await findTodos(dir);
		expect(result.truncated).toBe(false);
		expect(result.matches.map((m) => `${m.file}:${m.line}:${m.marker}`).sort()).toEqual([
			"src/tracked.ts:2:TODO",
			"untracked.ts:1:FIXME",
		]);
	});

	test("returns no matches for a repo without markers", async () => {
		writeFileSync(join(dir, "clean.ts"), "const a = 1;\n");
		expect(await findTodos(dir)).toEqual({ matches: [], truncated: false });
	});

	test("caps results at the maximum", async () => {
		const lines = Array.from({ length: MAX_TODO_MATCHES + 5 }, (_, i) => `// TODO item ${i}`).join("\n");
		writeFileSync(join(dir, "many.ts"), `${lines}\n`);
		const result = await findTodos(dir);
		expect(result.matches).toHaveLength(MAX_TODO_MATCHES);
		expect(result.truncated).toBe(true);
	});
});
