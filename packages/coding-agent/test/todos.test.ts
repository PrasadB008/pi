import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTodos, formatTodos, parseTodoLine } from "../src/core/todos.ts";

describe("parseTodoLine", () => {
	it("extracts text after the marker", () => {
		expect(parseTodoLine("// TODO: fix this")).toBe("fix this");
		expect(parseTodoLine("# TODO(alice) - handle errors")).toBe("handle errors");
		expect(parseTodoLine("/* TODO tidy up */")).toBe("tidy up");
		expect(parseTodoLine("// TODO")).toBe("");
	});

	it("ignores lowercase and embedded words", () => {
		expect(parseTodoLine("const todos = []")).toBeUndefined();
		expect(parseTodoLine("// todo: lowercase")).toBeUndefined();
		expect(parseTodoLine("const MYTODO = 1")).toBeUndefined();
	});
});

describe("findTodos", () => {
	let cwd: string;

	beforeEach(() => {
		cwd = join(tmpdir(), `todos-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(join(cwd, "src"), { recursive: true });
		mkdirSync(join(cwd, "node_modules", "dep"), { recursive: true });
	});

	afterEach(() => {
		rmSync(cwd, { recursive: true, force: true });
	});

	it("finds TODOs with file and line, skipping node_modules and binary files", async () => {
		writeFileSync(join(cwd, "src", "a.ts"), "const a = 1;\n// TODO: first\nconst b = 2; // TODO(x): second\n");
		writeFileSync(join(cwd, "node_modules", "dep", "index.js"), "// TODO: ignored\n");
		writeFileSync(join(cwd, "image.bin"), Buffer.from([0, 1, 2, 84, 79, 68, 79]));

		const result = await findTodos(cwd);

		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "src/a.ts", line: 2, text: "first" },
			{ file: "src/a.ts", line: 3, text: "second" },
		]);
	});

	it("truncates at maxItems", async () => {
		writeFileSync(join(cwd, "src", "a.ts"), "// TODO: 1\n// TODO: 2\n// TODO: 3\n");

		const result = await findTodos(cwd, { maxItems: 2 });

		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});
});

describe("formatTodos", () => {
	it("reports when nothing is found", () => {
		expect(formatTodos({ items: [], truncated: false })).toBe("No TODO comments found.");
	});

	it("groups items by file", () => {
		const output = formatTodos({
			items: [
				{ file: "a.ts", line: 1, text: "one" },
				{ file: "a.ts", line: 5, text: "two" },
				{ file: "b.ts", line: 2, text: "" },
			],
			truncated: false,
		});

		expect(output).toContain("3 TODOs in 2 files");
		expect(output).toContain("**a.ts**\n- `1` one\n- `5` two");
		expect(output).toContain("**b.ts**\n- `2` (no description)");
	});
});
