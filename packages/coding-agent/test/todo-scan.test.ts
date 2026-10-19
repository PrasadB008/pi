import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodos, matchTodoLine, scanTodos } from "../src/utils/todo-scan.ts";

describe("matchTodoLine", () => {
	it("matches TODO after common comment markers", () => {
		expect(matchTodoLine("  // TODO: fix this")).toBe("// TODO: fix this");
		expect(matchTodoLine("x = 1 # TODO tidy")).toBe("x = 1 # TODO tidy");
		expect(matchTodoLine("/* TODO block */")).toBe("/* TODO block */");
		expect(matchTodoLine(" * TODO in jsdoc")).toBe("* TODO in jsdoc");
		expect(matchTodoLine("<!-- TODO html -->")).toBe("<!-- TODO html -->");
	});

	it("ignores TODO outside comments and partial words", () => {
		expect(matchTodoLine("const TODO = 1;")).toBeUndefined();
		expect(matchTodoLine("// TODOS are listed elsewhere")).toBeUndefined();
		expect(matchTodoLine("nothing here")).toBeUndefined();
	});

	it("truncates long lines", () => {
		const result = matchTodoLine(`// TODO ${"x".repeat(300)}`);
		expect(result?.length).toBe(160);
		expect(result?.endsWith("...")).toBe(true);
	});
});

describe("scanTodos", () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "pi-todo-"));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("finds TODO comments with file and line, skipping node_modules and binary files", async () => {
		mkdirSync(join(dir, "src"));
		mkdirSync(join(dir, "node_modules"));
		writeFileSync(join(dir, "src", "a.ts"), "const a = 1;\n// TODO: first\nconst b = 2; // TODO second\n");
		writeFileSync(join(dir, "b.py"), "# TODO python\r\nprint(1)\r\n");
		writeFileSync(join(dir, "node_modules", "dep.js"), "// TODO ignored\n");
		writeFileSync(join(dir, "bin.dat"), Buffer.from([0x2f, 0x2f, 0x20, 0x54, 0x4f, 0x44, 0x4f, 0x00]));

		const result = await scanTodos(dir);

		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "b.py", line: 1, text: "# TODO python" },
			{ file: "src/a.ts", line: 2, text: "// TODO: first" },
			{ file: "src/a.ts", line: 3, text: "const b = 2; // TODO second" },
		]);
	});

	it("truncates at maxResults", async () => {
		writeFileSync(join(dir, "a.ts"), "// TODO 1\n// TODO 2\n// TODO 3\n");

		const result = await scanTodos(dir, { maxResults: 2 });

		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});
});

describe("formatTodos", () => {
	it("reports when nothing is found", () => {
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO comments found.");
	});

	it("groups items by file", () => {
		const text = formatTodos({
			items: [
				{ file: "a.ts", line: 1, text: "// TODO x" },
				{ file: "a.ts", line: 4, text: "// TODO y" },
				{ file: "b.ts", line: 2, text: "// TODO z" },
			],
			truncated: false,
		});
		expect(text).toBe(
			["Found 3 TODO comment(s):", "", "a.ts", "  1: // TODO x", "  4: // TODO y", "", "b.ts", "  2: // TODO z"].join(
				"\n",
			),
		);
	});
});

describe("/todo registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
