import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { execCommand } from "../src/core/exec.ts";
import { findTodos, formatTodos, parseTodoGrepOutput } from "../src/core/todos.ts";

describe("todos", () => {
	const dirs: string[] = [];

	afterEach(() => {
		for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
	});

	function makeDir(): string {
		const dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		dirs.push(dir);
		return dir;
	}

	it("parses git grep output into items", () => {
		const items = parseTodoGrepOutput("src/a.ts:12:\t// TODO: handle errors\nsrc/b.ts:3:// FIXME(bob) broken\n");
		expect(items).toEqual([
			{ file: "src/a.ts", line: 12, kind: "TODO", text: "handle errors" },
			{ file: "src/b.ts", line: 3, kind: "FIXME", text: "(bob) broken" },
		]);
	});

	it("formats items grouped by file", () => {
		const text = formatTodos({
			items: [
				{ file: "a.ts", line: 1, kind: "TODO", text: "one" },
				{ file: "a.ts", line: 5, kind: "FIXME", text: "two" },
			],
			total: 2,
		});
		expect(text).toContain("a.ts\n  1: one\n  5: FIXME two");
	});

	it("reports an empty result and an error", () => {
		expect(formatTodos({ items: [], total: 0 })).toBe("No TODO or FIXME comments found.");
		expect(formatTodos({ items: [], total: 0, error: "boom" })).toBe("Could not scan for TODOs: boom");
	});

	it("finds todos in a git repository and honors the limit", async () => {
		const dir = makeDir();
		await execCommand("git", ["init", "-q"], dir);
		writeFileSync(join(dir, "a.ts"), "// TODO: first\nconst x = 1;\n// FIXME second\n");
		writeFileSync(join(dir, "b.ts"), "// TODO third\n");

		const all = await findTodos(dir);
		expect(all.error).toBeUndefined();
		expect(all.total).toBe(3);
		expect(all.items.map((item) => `${item.file}:${item.line}`)).toEqual(["a.ts:1", "a.ts:3", "b.ts:1"]);

		const limited = await findTodos(dir, 1);
		expect(limited.total).toBe(3);
		expect(limited.items).toHaveLength(1);
	});
});
