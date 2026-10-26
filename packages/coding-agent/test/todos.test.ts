import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTodos, parseTodoLine } from "../src/utils/todos.ts";

describe("parseTodoLine", () => {
	it("extracts TODO and FIXME from comments", () => {
		expect(parseTodoLine("// TODO: handle errors")).toEqual({ tag: "TODO", text: "handle errors" });
		expect(parseTodoLine("  # FIXME(bob) broken on windows")).toEqual({ tag: "FIXME", text: "broken on windows" });
		expect(parseTodoLine("/* TODO tidy up */")).toEqual({ tag: "TODO", text: "tidy up" });
	});

	it("ignores tags outside comments", () => {
		expect(parseTodoLine('const tag = "TODO";')).toBeUndefined();
		expect(parseTodoLine("// nothing here")).toBeUndefined();
	});
});

describe("findTodos", () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("scans files, skips node_modules and binary files, and reports line numbers", async () => {
		mkdirSync(join(dir, "src"));
		mkdirSync(join(dir, "node_modules"));
		writeFileSync(join(dir, "src", "a.ts"), "const a = 1;\n// TODO: first\n// FIXME second\n");
		writeFileSync(join(dir, "node_modules", "dep.js"), "// TODO: ignored\n");
		writeFileSync(join(dir, "bin.dat"), Buffer.from([0, 1, 2, 0x2f, 0x2f, 0x20, 0x54, 0x4f, 0x44, 0x4f]));

		const result = await findTodos(dir);

		expect(result.truncated).toBe(false);
		expect(result.items).toEqual([
			{ file: "src/a.ts", line: 2, tag: "TODO", text: "first" },
			{ file: "src/a.ts", line: 3, tag: "FIXME", text: "second" },
		]);
	});

	it("truncates at maxItems", async () => {
		writeFileSync(join(dir, "a.ts"), "// TODO: one\n// TODO: two\n// TODO: three\n");

		const result = await findTodos(dir, { maxItems: 2 });

		expect(result.items).toHaveLength(2);
		expect(result.truncated).toBe(true);
	});
});
