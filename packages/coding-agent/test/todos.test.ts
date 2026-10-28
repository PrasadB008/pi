import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findTodos, formatTodosMarkdown, parseGitGrepOutput } from "../src/core/todos.ts";

describe("todos", () => {
	const dirs: string[] = [];
	afterEach(() => {
		for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
	});

	it("parses git grep output and caps matches while still counting", () => {
		const output = "a.ts:3:// TODO: one\nb/c.ts:10:  // FIXME two\na.ts:7:// TODO: three\n";
		const result = parseGitGrepOutput(output, 2);
		expect(result.total).toBe(3);
		expect(result.matches).toEqual([
			{ file: "a.ts", line: 3, text: "// TODO: one" },
			{ file: "b/c.ts", line: 10, text: "// FIXME two" },
		]);
	});

	it("formats matches grouped by file with a cap notice", () => {
		const markdown = formatTodosMarkdown({
			matches: [
				{ file: "a.ts", line: 3, text: "// TODO: one" },
				{ file: "a.ts", line: 7, text: "// TODO: two" },
			],
			total: 5,
		});
		expect(markdown.match(/\*\*a\.ts\*\*/g)).toHaveLength(1);
		expect(markdown).toContain("`3`: // TODO: one");
		expect(markdown).toContain("Showing first 2 of 5 matches.");
		expect(formatTodosMarkdown({ matches: [], total: 0 })).toBe("No TODO or FIXME comments found.");
	});

	it("finds tracked and new files but skips ignored files", async () => {
		const dir = mkdtempSync(join(tmpdir(), "pi-todos-"));
		dirs.push(dir);
		const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: "ignore" });
		git("init");
		writeFileSync(join(dir, ".gitignore"), "ignored.ts\n");
		mkdirSync(join(dir, "src"));
		writeFileSync(join(dir, "src", "tracked.ts"), "const a = 1;\n// TODO: tracked\n");
		git("add", ".gitignore", "src/tracked.ts");
		writeFileSync(join(dir, "new.ts"), "// FIXME: untracked\n");
		writeFileSync(join(dir, "ignored.ts"), "// TODO: ignored\n");

		const result = await findTodos(dir);
		const files = result.matches.map((m) => m.file).sort();
		expect(files).toEqual(["new.ts", "src/tracked.ts"]);
		expect(result.matches.find((m) => m.file === "src/tracked.ts")?.line).toBe(2);
	});
});
