import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findTodos, formatTodos, parseTodoGrepOutput } from "../src/utils/todos.ts";

describe("todos", () => {
	let dir: string | undefined;

	afterEach(() => {
		if (dir) rmSync(dir, { recursive: true, force: true });
		dir = undefined;
	});

	it("parses git grep output", () => {
		const items = parseTodoGrepOutput("src/a.ts:12:\t// TODO: fix this\nsrc/b.ts:3:// FIXME later\n");
		expect(items).toEqual([
			{ file: "src/a.ts", line: 12, text: "// TODO: fix this" },
			{ file: "src/b.ts", line: 3, text: "// FIXME later" },
		]);
	});

	it("finds TODO and FIXME comments and skips gitignored files", () => {
		dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		execFileSync("git", ["init", "-q"], { cwd: dir });
		mkdirSync(join(dir, "src"));
		writeFileSync(join(dir, "src", "a.ts"), "const a = 1;\n// TODO: first\n// FIXME: second\n");
		writeFileSync(join(dir, ".gitignore"), "ignored.ts\n");
		writeFileSync(join(dir, "ignored.ts"), "// TODO: hidden\n");

		const result = findTodos(dir);
		expect(result.error).toBeUndefined();
		expect(result.items.map((i) => `${i.file}:${i.line}`)).toEqual(["src/a.ts:2", "src/a.ts:3"]);
		expect(formatTodos(result)).toContain("  2: // TODO: first");
	});

	it("reports when nothing is found and when results are truncated", () => {
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO or FIXME comments found.");
		const text = formatTodos({ items: [{ file: "a.ts", line: 1, text: "// TODO" }], truncated: true });
		expect(text).toContain("Showing the first 1 matches.");
	});
});
