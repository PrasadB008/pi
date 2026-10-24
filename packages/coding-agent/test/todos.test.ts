import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseTodoLines, scanTodos } from "../src/utils/todos.ts";
import { getToolPath } from "../src/utils/tools-manager.ts";

describe("parseTodoLines", () => {
	it("parses path:line:text output and extracts the tag", () => {
		const items = parseTodoLines("./src/a.ts:12:\t// TODO: handle errors\n./src/b.ts:3:# FIXME broken\n");
		expect(items).toEqual([
			{ file: "./src/a.ts", line: 12, tag: "TODO", text: "// TODO: handle errors" },
			{ file: "./src/b.ts", line: 3, tag: "FIXME", text: "# FIXME broken" },
		]);
	});

	it("ignores malformed lines and truncates long text", () => {
		const long = `// TODO ${"x".repeat(500)}`;
		const items = parseTodoLines(`garbage\n\n./a.ts:1:${long}\n`);
		expect(items).toHaveLength(1);
		expect(items[0].text.length).toBe(200);
		expect(items[0].text.endsWith("...")).toBe(true);
	});
});

// scanTodos needs a ripgrep binary; do not depend on downloading one.
describe.skipIf(!getToolPath("rg"))("scanTodos", () => {
	const dirs: string[] = [];
	afterEach(() => {
		for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
	});

	it("finds markers, skips plain text and honors the limit", async () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		dirs.push(dir);
		mkdirSync(join(dir, "src"));
		writeFileSync(join(dir, "src", "a.ts"), "const a = 1;\n// TODO: first\n// a todo in prose\n");
		writeFileSync(join(dir, "b.ts"), "// FIXME second\n// HACK third\n");

		const all = await scanTodos(dir);
		expect(all.truncated).toBe(false);
		expect(all.items.map((i) => `${i.file.replace(/\\/g, "/")}:${i.line}:${i.tag}`)).toEqual([
			"b.ts:1:FIXME",
			"b.ts:2:HACK",
			"src/a.ts:2:TODO",
		]);

		const limited = await scanTodos(dir, 2);
		expect(limited.items).toHaveLength(2);
		expect(limited.truncated).toBe(true);
	});

	it("honors .gitignore outside a git repository", async () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		dirs.push(dir);
		mkdirSync(join(dir, "dist"));
		writeFileSync(join(dir, ".gitignore"), "dist/\n");
		writeFileSync(join(dir, "dist", "out.js"), "// TODO: generated\n");
		writeFileSync(join(dir, "a.ts"), "// TODO: real\n");

		const result = await scanTodos(dir);
		expect(result.items.map((i) => i.file)).toEqual(["a.ts"]);
	});

	it("reports markers on very long lines", async () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		dirs.push(dir);
		writeFileSync(join(dir, "min.js"), `// TODO ${"x".repeat(5000)}\n`);

		const result = await scanTodos(dir);
		expect(result.items).toHaveLength(1);
		expect(result.items[0].tag).toBe("TODO");
	});

	it("rejects when the signal is already aborted", async () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		dirs.push(dir);
		await expect(scanTodos(dir, 10, AbortSignal.abort())).rejects.toThrow("aborted");
	});
});
