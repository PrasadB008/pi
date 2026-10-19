import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodos, scanTodos } from "../src/core/todo-scanner.ts";

describe("scanTodos", () => {
	let root: string;

	beforeEach(() => {
		root = join(tmpdir(), `todo-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(root, { recursive: true });
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds TODO and FIXME comments with file and line", () => {
		mkdirSync(join(root, "src"));
		writeFileSync(join(root, "src", "a.ts"), "const a = 1;\n// TODO: handle errors\n/* FIXME broken */\n");
		writeFileSync(join(root, "b.py"), "# TODO(me): port this\n");

		const { items, truncated } = scanTodos(root);

		expect(truncated).toBe(false);
		expect(items).toEqual([
			{ file: "b.py", line: 1, tag: "TODO", text: "port this" },
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "handle errors" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "broken" },
		]);
	});

	it("ignores markers outside comments and lookalike identifiers", () => {
		writeFileSync(
			join(root, "a.ts"),
			'const label = "TODO";\nconst todoList = [];\n// TODOS are tracked elsewhere\n',
		);

		expect(scanTodos(root).items).toEqual([]);
	});

	it("skips ignored directories and binary files", () => {
		mkdirSync(join(root, "node_modules"));
		mkdirSync(join(root, ".git"));
		writeFileSync(join(root, "node_modules", "x.js"), "// TODO: dep\n");
		writeFileSync(join(root, ".git", "y"), "# TODO: git\n");
		writeFileSync(join(root, "bin.dat"), Buffer.from([0, 1, 2, 0x2f, 0x2f, 0x20, 0x54, 0x4f, 0x44, 0x4f]));

		expect(scanTodos(root).items).toEqual([]);
	});

	it("stops at maxItems and reports truncation", () => {
		writeFileSync(join(root, "a.ts"), "// TODO: one\n// TODO: two\n// TODO: three\n");

		const result = scanTodos(root, { maxItems: 2 });

		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});

	it("skips files larger than maxFileSize", () => {
		writeFileSync(join(root, "big.ts"), `// TODO: big\n${"x".repeat(100)}\n`);

		expect(scanTodos(root, { maxFileSize: 50 }).items).toEqual([]);
	});
});

describe("formatTodos", () => {
	it("reports when nothing is found", () => {
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO comments found.");
	});

	it("groups items by file and summarizes", () => {
		const text = formatTodos({
			items: [
				{ file: "a.ts", line: 2, tag: "TODO", text: "one" },
				{ file: "a.ts", line: 5, tag: "FIXME", text: "" },
				{ file: "b.ts", line: 1, tag: "TODO", text: "two" },
			],
			truncated: false,
		});

		expect(text).toContain("**a.ts**\n- L2 TODO: one\n- L5 FIXME");
		expect(text).toContain("**b.ts**\n- L1 TODO: two");
		expect(text).toContain("3 items in 2 files.");
	});

	it("notes truncation", () => {
		const text = formatTodos({ items: [{ file: "a.ts", line: 1, tag: "TODO", text: "x" }], truncated: true });

		expect(text).toContain("limit reached");
	});
});

describe("/todo registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
