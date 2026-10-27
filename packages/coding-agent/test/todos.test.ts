import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTodos, formatTodos, MAX_TODO_MATCHES, parseTodoOutput } from "../src/core/todos.ts";

describe("parseTodoOutput", () => {
	it("parses git grep output and trims text", () => {
		expect(parseTodoOutput("src/a.ts:12:\t// TODO: fix this\nnot a match\nb.ts:3:FIXME x\n")).toEqual([
			{ file: "src/a.ts", line: 12, text: "// TODO: fix this" },
			{ file: "b.ts", line: 3, text: "FIXME x" },
		]);
	});
});

describe("formatTodos", () => {
	it("reports when nothing was found", () => {
		expect(formatTodos({ matches: [], total: 0 })).toBe("No TODO or FIXME comments found.");
	});

	it("groups matches by file and reports truncation", () => {
		const text = formatTodos({
			matches: [
				{ file: "a.ts", line: 1, text: "// TODO one" },
				{ file: "a.ts", line: 5, text: "// FIXME two" },
				{ file: "b.ts", line: 2, text: "// TODO three" },
			],
			total: 10,
		});
		expect(text).toBe(
			"a.ts\n  1: // TODO one\n  5: // FIXME two\n\nb.ts\n  2: // TODO three\n\nShowing first 3 of 10 matches.",
		);
	});
});

describe("findTodos", () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		execFileSync("git", ["init", "-q"], { cwd: dir });
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("finds tracked and untracked TODO/FIXME comments and skips ignored files", async () => {
		mkdirSync(join(dir, "src"));
		writeFileSync(join(dir, ".gitignore"), "ignored.ts\n");
		writeFileSync(join(dir, "src", "tracked.ts"), "const a = 1;\n// TODO: tracked\n");
		execFileSync("git", ["add", "src/tracked.ts"], { cwd: dir });
		writeFileSync(join(dir, "untracked.ts"), "// FIXME: untracked\n// TODOS are not markers\n");
		writeFileSync(join(dir, "ignored.ts"), "// TODO: ignored\n");

		const result = await findTodos(dir);

		expect(result.total).toBe(2);
		expect(result.matches).toEqual([
			{ file: "src/tracked.ts", line: 2, text: "// TODO: tracked" },
			{ file: "untracked.ts", line: 1, text: "// FIXME: untracked" },
		]);
	});

	it("returns an empty result when there are no markers", async () => {
		writeFileSync(join(dir, "clean.ts"), "export {};\n");
		expect(await findTodos(dir)).toEqual({ matches: [], total: 0 });
	});

	it("caps the number of returned matches but reports the total", async () => {
		const lines = Array.from({ length: MAX_TODO_MATCHES + 5 }, (_, i) => `// TODO ${i}`).join("\n");
		writeFileSync(join(dir, "many.ts"), `${lines}\n`);

		const result = await findTodos(dir);

		expect(result.matches).toHaveLength(MAX_TODO_MATCHES);
		expect(result.total).toBe(MAX_TODO_MATCHES + 5);
	});
});
