import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoScan, matchTodoLine, scanTodoComments } from "../src/core/todo-comments.ts";

describe("matchTodoLine", () => {
	it("matches TODO and FIXME in comments only", () => {
		expect(matchTodoLine("// TODO: fix this")?.kind).toBe("TODO");
		expect(matchTodoLine("x = 1  # FIXME later")?.kind).toBe("FIXME");
		expect(matchTodoLine(" * TODO in a block comment")?.kind).toBe("TODO");
		expect(matchTodoLine("const todo = 1;")).toBeUndefined();
		expect(matchTodoLine("// TODOS are not markers")).toBeUndefined();
	});
});

describe("scanTodoComments", () => {
	let root: string;

	beforeEach(() => {
		root = join(tmpdir(), `todos-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(join(root, "src"), { recursive: true });
		mkdirSync(join(root, "node_modules", "dep"), { recursive: true });
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("groups comments by file with line numbers and skips ignored directories", async () => {
		writeFileSync(join(root, "a.ts"), "const a = 1;\n// TODO: first\n");
		writeFileSync(join(root, "src", "b.py"), "x = 1\ny = 2\n# FIXME: second\n# TODO third\n");
		writeFileSync(join(root, "node_modules", "dep", "c.js"), "// TODO ignored\n");
		writeFileSync(join(root, "clean.ts"), "export {};\n");
		writeFileSync(join(root, "bin.dat"), Buffer.from([0, 1, 2, 47, 47, 32, 84, 79, 68, 79]));

		const result = await scanTodoComments(root);

		expect(result.total).toBe(3);
		expect(result.truncated).toBe(false);
		expect(result.files.map((f) => f.file)).toEqual(["a.ts", "src/b.py"]);
		expect(result.files[0].comments).toEqual([{ line: 2, kind: "TODO", text: "// TODO: first" }]);
		expect(result.files[1].comments.map((c) => [c.line, c.kind])).toEqual([
			[3, "FIXME"],
			[4, "TODO"],
		]);

		const output = formatTodoScan(result);
		expect(output).toContain("a.ts\n  2: // TODO: first");
		expect(output).toContain("src/b.py\n  3: # FIXME: second\n  4: # TODO third");
		expect(output).toContain("3 comments in 2 files");
	});

	it("stops at the comment limit", async () => {
		writeFileSync(join(root, "a.ts"), "// TODO 1\n// TODO 2\n// TODO 3\n");
		const result = await scanTodoComments(root, { maxComments: 2 });
		expect(result.total).toBe(2);
		expect(result.truncated).toBe(true);
	});

	it("reports when nothing is found", async () => {
		writeFileSync(join(root, "a.ts"), "export {};\n");
		expect(formatTodoScan(await scanTodoComments(root))).toBe("No TODO or FIXME comments found.");
	});
});

describe("/todos registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todos")).toBe(true);
	});
});
