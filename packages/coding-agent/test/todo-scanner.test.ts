import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { findTodos, formatTodos, parseTodoLine, scanContent } from "../src/core/todo-scanner.ts";

describe("todo scanner", () => {
	let root: string;

	beforeEach(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		fs.rmSync(root, { recursive: true, force: true });
	});

	it("registers /todos as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todos")).toBe(true);
	});

	it("parses TODO and FIXME comments with line numbers", () => {
		expect(parseTodoLine("const a = 1; // TODO: handle errors", 4)).toEqual({
			line: 4,
			kind: "TODO",
			text: "handle errors",
		});
		expect(parseTodoLine("# FIXME(bob) broken on windows", 2)).toEqual({
			line: 2,
			kind: "FIXME",
			text: "broken on windows",
		});
		expect(parseTodoLine("/* TODO tidy up */", 1)?.text).toBe("tidy up");
	});

	it("ignores lines that are not comments or only contain the word as part of another word", () => {
		expect(parseTodoLine("const TODO = 1;", 1)).toBeUndefined();
		expect(parseTodoLine("// TODOS are tracked elsewhere", 1)).toBeUndefined();
		expect(scanContent("a\nb\n// FIXME later\nc").map((item) => item.line)).toEqual([3]);
	});

	it("groups results by file, skipping ignored directories and binary files", () => {
		fs.mkdirSync(path.join(root, "src"));
		fs.mkdirSync(path.join(root, "node_modules"));
		fs.writeFileSync(path.join(root, "src", "a.ts"), "x\n// TODO first\ny\n// FIXME second\n");
		fs.writeFileSync(path.join(root, "b.py"), "# TODO python\n");
		fs.writeFileSync(path.join(root, "clean.ts"), "const x = 1;\n");
		fs.writeFileSync(path.join(root, "node_modules", "dep.js"), "// TODO ignored\n");
		fs.writeFileSync(path.join(root, "bin.dat"), Buffer.from([0, 1, 2, 0x2f, 0x2f, 0x20, 0x54, 0x4f, 0x44, 0x4f]));

		const results = findTodos(root);
		expect(results.map((r) => r.file)).toEqual(["b.py", "src/a.ts"]);
		expect(results[1].items).toEqual([
			{ line: 2, kind: "TODO", text: "first" },
			{ line: 4, kind: "FIXME", text: "second" },
		]);

		const output = formatTodos(results);
		expect(output).toContain("3 TODO/FIXME comments in 2 files");
		expect(output).toContain("src/a.ts\n  2: TODO first\n  4: FIXME second");
	});

	it("reports when nothing is found", () => {
		expect(formatTodos(findTodos(root))).toBe("No TODO or FIXME comments found.");
	});
});
