import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { findTodos, formatTodos, parseTodos } from "../src/core/todos.ts";

const tempDirs: string[] = [];

function makeProject(files: Record<string, string>): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "pi-todos-"));
	tempDirs.push(root);
	for (const [name, content] of Object.entries(files)) {
		const full = path.join(root, name);
		fs.mkdirSync(path.dirname(full), { recursive: true });
		fs.writeFileSync(full, content);
	}
	return root;
}

afterEach(() => {
	for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe("/todos", () => {
	test("is registered as a built-in command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todos")).toBe(true);
	});

	test("parseTodos matches markers in comments only", () => {
		const items = parseTodos(
			["const a = 1; // TODO: fix this", "# fixme later", "/* HACK: temporary */", "const todo = 'TODO';"].join(
				"\n",
			),
			"x.ts",
		);
		expect(items).toEqual([
			{ file: "x.ts", line: 1, tag: "TODO", text: "fix this" },
			{ file: "x.ts", line: 2, tag: "FIXME", text: "later" },
			{ file: "x.ts", line: 3, tag: "HACK", text: "temporary" },
		]);
	});

	test("findTodos scans recursively, skips ignored dirs and binary files", () => {
		const root = makeProject({
			"src/a.ts": "// TODO: first\n",
			"src/nested/b.py": "x = 1\n# FIXME broken\n",
			"node_modules/pkg/index.js": "// TODO: ignored\n",
			".git/config": "# TODO: ignored\n",
		});
		fs.writeFileSync(path.join(root, "bin.dat"), Buffer.from([0, 1, 2, 47, 47, 32, 84, 79, 68, 79]));

		const items = findTodos(root);
		expect(items.map((item) => `${item.file}:${item.line}:${item.tag}`)).toEqual([
			"src/a.ts:1:TODO",
			"src/nested/b.py:2:FIXME",
		]);
	});

	test("findTodos honours maxItems and formatTodos reports truncation", () => {
		const root = makeProject({ "a.ts": "// TODO: one\n// TODO: two\n// TODO: three\n" });
		const items = findTodos(root, { maxItems: 2 });
		expect(items).toHaveLength(2);
		const output = formatTodos(items, true);
		expect(output).toContain("**a.ts**");
		expect(output).toContain("- L1 TODO: one");
		expect(output).toContain("Showing the first 2 items.");
	});

	test("formatTodos handles no results", () => {
		expect(formatTodos([], false)).toBe("No TODO comments found.");
	});
});
