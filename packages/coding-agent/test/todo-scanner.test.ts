import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTodosInText, scanTodos } from "../src/core/todo-scanner.ts";

describe("findTodosInText", () => {
	it("finds TODO and FIXME in common comment styles", () => {
		const content = [
			"const a = 1; // TODO: handle errors",
			"# FIXME(bob) broken on windows",
			"/* TODO close this */",
			" * TODO in block comment",
			"const s = 'TODO not a comment';",
			"// todo lowercase is ignored",
		].join("\n");

		const items = findTodosInText("a.ts", content);

		expect(items.map((i) => [i.line, i.tag, i.text])).toEqual([
			[1, "TODO", "handle errors"],
			[2, "FIXME", "broken on windows"],
			[3, "TODO", "close this"],
			[4, "TODO", "in block comment"],
		]);
	});
});

describe("scanTodos", () => {
	let dir: string;

	beforeEach(() => {
		dir = join(tmpdir(), `todo-scan-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(join(dir, "src"), { recursive: true });
		mkdirSync(join(dir, "node_modules", "pkg"), { recursive: true });
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("scans files, skips ignored dirs and binary files", async () => {
		writeFileSync(join(dir, "src", "b.ts"), "// TODO: second\n");
		writeFileSync(join(dir, "src", "a.ts"), "x\n// FIXME first\n");
		writeFileSync(join(dir, "node_modules", "pkg", "i.js"), "// TODO vendor\n");
		writeFileSync(join(dir, "bin.dat"), "// TODO binary\0");

		const result = await scanTodos(dir);

		expect(result.items.map((i) => `${i.file}:${i.line}:${i.tag}`)).toEqual(["src/a.ts:2:FIXME", "src/b.ts:1:TODO"]);
		expect(result.filesScanned).toBe(2);
	});
});
