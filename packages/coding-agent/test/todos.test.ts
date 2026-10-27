import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { groupTodosByFile, parseTodoLines, scanTodos } from "../src/core/todos.ts";

describe("todos", () => {
	const dirs: string[] = [];
	afterEach(() => {
		for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
	});

	it("parses git grep output into items", () => {
		const items = parseTodoLines("src/a.ts:3:\t// TODO: fix this\nsrc/b.ts:10:// FIXME handle null\n");
		expect(items).toEqual([
			{ file: "src/a.ts", line: 3, kind: "TODO", text: "// TODO: fix this" },
			{ file: "src/b.ts", line: 10, kind: "FIXME", text: "// FIXME handle null" },
		]);
	});

	it("groups items by file", () => {
		const groups = groupTodosByFile(parseTodoLines("a.ts:1:TODO x\nb.ts:2:TODO y\na.ts:5:FIXME z\n"));
		expect([...groups.keys()]).toEqual(["a.ts", "b.ts"]);
		expect(groups.get("a.ts")?.map((i) => i.line)).toEqual([1, 5]);
	});

	it("scans a git repo and skips gitignored files", async () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		dirs.push(dir);
		execFileSync("git", ["init", "-q"], { cwd: dir });
		writeFileSync(join(dir, ".gitignore"), "ignored.ts\n");
		writeFileSync(join(dir, "kept.ts"), "const a = 1;\n// TODO: later\n");
		writeFileSync(join(dir, "ignored.ts"), "// TODO: should not appear\n");

		const result = await scanTodos(dir);
		expect(result.error).toBeUndefined();
		expect(result.items.map((i) => `${i.file}:${i.line}`)).toEqual(["kept.ts:2"]);
	});

	it("reports an error outside a git repository", async () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-todos-nogit-"));
		dirs.push(dir);
		const result = await scanTodos(dir);
		expect(result.items).toEqual([]);
		expect(result.error).toBeDefined();
	});
});
