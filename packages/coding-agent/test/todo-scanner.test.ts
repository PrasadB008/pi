import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodos, matchTodoLine, scanTodos } from "../src/core/todo-scanner.ts";

describe("matchTodoLine", () => {
	it("matches common comment styles", () => {
		expect(matchTodoLine("const a = 1; // TODO: fix this")).toBe("fix this");
		expect(matchTodoLine("# TODO handle errors")).toBe("handle errors");
		expect(matchTodoLine("/* TODO(bob): later */")).toBe("later");
		expect(matchTodoLine(" * TODO cleanup")).toBe("cleanup");
		expect(matchTodoLine("<!-- TODO: docs -->")).toBe("docs");
		expect(matchTodoLine("-- TODO sql")).toBe("sql");
		expect(matchTodoLine("// TODO")).toBe("");
	});

	it("ignores non-comment and lowercase mentions", () => {
		expect(matchTodoLine("const TODO = 1;")).toBeUndefined();
		expect(matchTodoLine("// todo lowercase")).toBeUndefined();
		expect(matchTodoLine("// TODOS are listed elsewhere")).toBeUndefined();
	});
});

describe("scanTodos", () => {
	let root: string;

	beforeEach(() => {
		root = join(tmpdir(), `todo-scan-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(join(root, "src"), { recursive: true });
		mkdirSync(join(root, "node_modules", "dep"), { recursive: true });
		mkdirSync(join(root, ".git"), { recursive: true });
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("finds TODOs with relative paths and line numbers, sorted", async () => {
		writeFileSync(join(root, "b.ts"), "x\n// TODO: second\n");
		writeFileSync(join(root, "src", "a.ts"), "// TODO first\n\n# TODO third\n");

		const result = await scanTodos(root);

		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "b.ts", line: 2, text: "second" },
			{ file: "src/a.ts", line: 1, text: "first" },
			{ file: "src/a.ts", line: 3, text: "third" },
		]);
	});

	it("skips ignored directories, binary files and oversized files", async () => {
		writeFileSync(join(root, "node_modules", "dep", "i.js"), "// TODO ignored\n");
		writeFileSync(join(root, ".git", "config"), "# TODO ignored\n");
		writeFileSync(join(root, "bin.dat"), Buffer.from([0, 1, 2, 0x2f, 0x2f, 0x20, 0x54, 0x4f, 0x44, 0x4f]));
		writeFileSync(join(root, "big.ts"), `// TODO big\n${"x".repeat(200)}\n`);
		writeFileSync(join(root, "ok.ts"), "// TODO kept\n");

		const result = await scanTodos(root, { maxFileSize: 100 });

		expect(result.items).toEqual([{ file: "ok.ts", line: 1, text: "kept" }]);
	});

	it("truncates at maxResults", async () => {
		writeFileSync(join(root, "a.ts"), "// TODO 1\n// TODO 2\n// TODO 3\n");

		const result = await scanTodos(root, { maxResults: 2 });

		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
		expect(formatTodos(result)).toContain("showing first 2");
	});
});

describe("formatTodos", () => {
	it("reports when nothing is found", () => {
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO comments found");
	});

	it("formats file:line and text", () => {
		expect(
			formatTodos({
				items: [
					{ file: "a.ts", line: 4, text: "do it" },
					{ file: "b.ts", line: 9, text: "" },
				],
				truncated: false,
			}),
		).toBe("a.ts:4  do it\nb.ts:9");
	});
});

describe("/todo slash command", () => {
	it("is registered as a builtin command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
