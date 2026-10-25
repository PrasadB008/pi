import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTodosInText, formatTodosMarkdown, scanTodos } from "../src/core/todos.ts";

describe("findTodosInText", () => {
	it("finds TODO and FIXME markers with line numbers and text", () => {
		const items = findTodosInText(
			"a.ts",
			["const a = 1;", "// TODO: handle errors", "/* FIXME(bob) broken */", "# todo lowercase ignored"].join("\n"),
		);
		expect(items).toEqual([
			{ file: "a.ts", line: 2, tag: "TODO", text: "handle errors" },
			{ file: "a.ts", line: 3, tag: "FIXME", text: "broken" },
		]);
	});

	it("ignores identifiers that merely contain the marker", () => {
		expect(findTodosInText("a.ts", "const TODOS_PATH = 1; const myTODOList = 2;")).toEqual([]);
	});
});

describe("scanTodos", () => {
	let dir: string;

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-todos-"));
	});

	afterEach(() => {
		fs.rmSync(dir, { recursive: true, force: true });
	});

	it("scans nested files, skips node_modules and binary files", async () => {
		fs.mkdirSync(path.join(dir, "src"));
		fs.mkdirSync(path.join(dir, "node_modules"));
		fs.writeFileSync(path.join(dir, "src", "b.ts"), "// TODO: second\n// FIXME: third\n");
		fs.writeFileSync(path.join(dir, "a.ts"), "// TODO: first\n");
		fs.writeFileSync(path.join(dir, "node_modules", "dep.js"), "// TODO: dependency\n");
		fs.writeFileSync(path.join(dir, "bin.dat"), Buffer.from([0, 1, 2, 84, 79, 68, 79]));

		const result = await scanTodos(dir);

		expect(result.truncated).toBe(false);
		expect(result.items.map((i) => `${i.file}:${i.line}:${i.text}`)).toEqual([
			"a.ts:1:first",
			"src/b.ts:1:second",
			"src/b.ts:2:third",
		]);
	});
});

describe("formatTodosMarkdown", () => {
	it("reports when nothing is found", () => {
		expect(formatTodosMarkdown({ items: [], truncated: false })).toBe("No TODO or FIXME comments found.");
	});

	it("groups items by file with a summary", () => {
		const markdown = formatTodosMarkdown({
			items: [
				{ file: "a.ts", line: 1, tag: "TODO", text: "one" },
				{ file: "a.ts", line: 4, tag: "FIXME", text: "two" },
				{ file: "b.ts", line: 2, tag: "TODO", text: "three" },
			],
			truncated: false,
		});
		expect(markdown).toContain("3 outstanding in 2 files");
		expect(markdown).toContain("**a.ts**");
		expect(markdown).toContain("`4` **FIXME** two");
		expect(markdown).toContain("**b.ts**");
	});
});
