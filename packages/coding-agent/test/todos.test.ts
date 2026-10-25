import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTodos, formatTodos, parseGitGrepOutput } from "../src/utils/todos.ts";

describe("todos", () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("parses git grep -z output", () => {
		const output = "a.ts\x003\x00// TODO: one\nsrc/b.ts\x0012\x00  FIXME two\n";
		expect(parseGitGrepOutput(output)).toEqual([
			{ file: "a.ts", line: 3, text: "// TODO: one" },
			{ file: "src/b.ts", line: 12, text: "FIXME two" },
		]);
	});

	it("finds TODO and FIXME comments and respects .gitignore", async () => {
		execFileSync("git", ["init", "-q"], { cwd: dir });
		mkdirSync(join(dir, "ignored"));
		writeFileSync(join(dir, ".gitignore"), "ignored/\n");
		writeFileSync(join(dir, "a.ts"), "const x = 1;\n// TODO: fix x\n");
		writeFileSync(join(dir, "b.ts"), "// FIXME broken\n// TODOS are not matched\n");
		writeFileSync(join(dir, "ignored", "c.ts"), "// TODO ignored\n");

		const items = await findTodos(dir);
		expect(items.map((i) => `${i.file}:${i.line}`).sort()).toEqual(["a.ts:2", "b.ts:1"]);
	});

	it("returns an empty list when nothing matches", async () => {
		writeFileSync(join(dir, "a.ts"), "const x = 1;\n");
		expect(await findTodos(dir)).toEqual([]);
	});

	it("formats grouped output and truncates", () => {
		expect(formatTodos([])).toBe("No TODO or FIXME comments found.");
		const items = [
			{ file: "a.ts", line: 1, text: "// TODO a" },
			{ file: "a.ts", line: 2, text: "// TODO b" },
			{ file: "b.ts", line: 3, text: "// TODO c" },
		];
		const text = formatTodos(items, 2);
		expect(text).toContain("3 TODO/FIXME comments");
		expect(text).toContain("  2: // TODO b");
		expect(text).not.toContain("b.ts");
		expect(text).toContain("Showing the first 2 of 3.");
	});
});
