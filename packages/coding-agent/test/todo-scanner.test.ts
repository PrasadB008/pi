import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { findTodosInText, formatTodos, scanTodos } from "../src/core/todo-scanner.ts";

describe("findTodosInText", () => {
	test("finds TODO and FIXME in comments with line numbers", () => {
		const content = [
			"const a = 1;",
			"// TODO: handle errors",
			"/* FIXME(bob) broken */",
			" * TODO wrap up",
			"# TODO python style",
			'const s = "TODO in a string";',
		].join("\n");

		expect(findTodosInText(content)).toEqual([
			{ line: 2, kind: "TODO", text: "handle errors" },
			{ line: 3, kind: "FIXME", text: "bob) broken" },
			{ line: 4, kind: "TODO", text: "wrap up" },
			{ line: 5, kind: "TODO", text: "python style" },
		]);
	});
});

describe("scanTodos", () => {
	let root: string;

	beforeEach(async () => {
		root = await mkdtemp(join(tmpdir(), "todos-test-"));
	});

	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	test("groups results by file and skips ignored directories and binary files", async () => {
		await mkdir(join(root, "src"), { recursive: true });
		await mkdir(join(root, "node_modules", "dep"), { recursive: true });
		await writeFile(join(root, "src", "b.ts"), "x\n// FIXME later\n");
		await writeFile(join(root, "a.ts"), "// TODO first\n\n// TODO second\n");
		await writeFile(join(root, "node_modules", "dep", "index.js"), "// TODO ignored\n");
		await writeFile(join(root, "bin.dat"), Buffer.from([0, 1, 2, 47, 47, 32, 84, 79, 68, 79]));

		const result = await scanTodos(root);

		expect(result.truncated).toBe(false);
		expect(result.files.map((f) => f.file)).toEqual(["a.ts", "src/b.ts"]);
		expect(result.files[0].items.map((i) => i.line)).toEqual([1, 3]);
		expect(formatTodos(result)).toBe(
			["a.ts", "  1: TODO first", "  3: TODO second", "", "src/b.ts", "  2: FIXME later"].join("\n"),
		);
	});

	test("reports when nothing is found", async () => {
		await writeFile(join(root, "a.ts"), "const a = 1;\n");
		expect(formatTodos(await scanTodos(root))).toBe("No TODO or FIXME comments found.");
	});

	test("truncates at the item limit", async () => {
		await writeFile(join(root, "a.ts"), "// TODO 1\n// TODO 2\n// TODO 3\n");
		const result = await scanTodos(root, { maxItems: 2 });
		expect(result.truncated).toBe(true);
		expect(result.files[0].items).toHaveLength(2);
	});
});

describe("/todos registration", () => {
	test("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todos")).toBe(true);
	});
});
