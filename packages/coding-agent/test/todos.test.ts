import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { extractTodos, findTodos, formatTodos, matchTodo } from "../src/utils/todos.ts";

describe("matchTodo", () => {
	test("finds TODO and FIXME markers and their text", () => {
		expect(matchTodo("// TODO: handle errors")).toEqual({ kind: "TODO", text: "handle errors" });
		expect(matchTodo("# FIXME(bob) broken on windows")).toEqual({ kind: "FIXME", text: "broken on windows" });
		expect(matchTodo("const todoList = []")).toBeUndefined();
	});
});

describe("extractTodos", () => {
	test("reports 1-based line numbers and skips binary content", () => {
		expect(extractTodos("a.ts", "x\n// TODO: one\ny")).toEqual([
			{ file: "a.ts", line: 2, kind: "TODO", text: "one" },
		]);
		expect(extractTodos("a.bin", "TODO\0")).toEqual([]);
	});
});

describe("findTodos", () => {
	let dir: string | undefined;

	afterEach(async () => {
		if (dir) await rm(dir, { recursive: true, force: true });
		dir = undefined;
	});

	test("scans files outside git and skips node_modules", async () => {
		dir = await mkdtemp(join(tmpdir(), "pi-todos-"));
		await mkdir(join(dir, "src"));
		await mkdir(join(dir, "node_modules"));
		await writeFile(join(dir, "src", "a.ts"), "// TODO: first\n");
		await writeFile(join(dir, "node_modules", "b.ts"), "// TODO: ignored\n");

		const items = await findTodos(dir);
		expect(items).toEqual([{ file: "src/a.ts", line: 1, kind: "TODO", text: "first" }]);
	});
});

describe("formatTodos", () => {
	test("groups by file and handles the empty case", () => {
		expect(formatTodos([])).toBe("No TODO or FIXME comments found.");
		const out = formatTodos([
			{ file: "a.ts", line: 1, kind: "TODO", text: "x" },
			{ file: "a.ts", line: 4, kind: "FIXME", text: "" },
		]);
		expect(out).toContain("2 outstanding items");
		expect(out).toContain("**a.ts**");
		expect(out).toContain("- `4` FIXME");
	});
});
