import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTodos, formatTodosMarkdown } from "../src/core/todos.ts";

describe("findTodos", () => {
	let dir: string;

	beforeEach(() => {
		dir = join(tmpdir(), `todos-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(join(dir, "src"), { recursive: true });
		execFileSync("git", ["init", "-q"], { cwd: dir });
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("lists TODO and FIXME lines, skipping gitignored, binary and oversized files", async () => {
		writeFileSync(join(dir, ".gitignore"), "ignored.ts\n");
		writeFileSync(join(dir, "src", "a.ts"), "const a = 1;\n// TODO: first\n// FIXME second\n");
		writeFileSync(join(dir, "b.ts"), "// TODO: in untracked file\n// todo lowercase is ignored\n");
		writeFileSync(join(dir, "ignored.ts"), "// TODO: ignored\n");
		writeFileSync(join(dir, "bin.dat"), Buffer.from("TODO\0binary"));
		writeFileSync(join(dir, "big.txt"), `TODO\n${"x".repeat(1024 * 1024 + 1)}`);

		const items = await findTodos(dir);

		expect(items).toEqual([
			{ file: "b.ts", line: 1, text: "// TODO: in untracked file" },
			{ file: "src/a.ts", line: 2, text: "// TODO: first" },
			{ file: "src/a.ts", line: 3, text: "// FIXME second" },
		]);
	});

	it("returns null outside a git repository", async () => {
		const plain = join(dir, "..", `plain-${Date.now()}`);
		mkdirSync(plain, { recursive: true });
		try {
			expect(await findTodos(plain)).toBeNull();
		} finally {
			rmSync(plain, { recursive: true, force: true });
		}
	});
});

describe("formatTodosMarkdown", () => {
	it("groups items by file with line numbers", () => {
		const markdown = formatTodosMarkdown([
			{ file: "a.ts", line: 2, text: "// TODO: x" },
			{ file: "a.ts", line: 5, text: "// FIXME: y" },
			{ file: "b.ts", line: 1, text: "// TODO: z" },
		]);
		expect(markdown).toBe(
			"3 outstanding in 2 files\n\n**a.ts**\n- `2`: // TODO: x\n- `5`: // FIXME: y\n\n**b.ts**\n- `1`: // TODO: z",
		);
	});

	it("reports when nothing is found", () => {
		expect(formatTodosMarkdown([])).toContain("No outstanding");
	});
});
