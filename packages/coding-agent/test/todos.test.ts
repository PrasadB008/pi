import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { findTodos, parseTodos } from "../src/utils/todos.ts";

describe("todos", () => {
	const dirs: string[] = [];

	afterEach(() => {
		for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
	});

	it("registers /todos as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todos")).toBe(true);
	});

	it("parses TODO comments in different comment styles", () => {
		const content = [
			"const a = 1; // TODO: first",
			"/* TODO(me) second */",
			"# TODO third",
			"const text = 'not a TODO here';",
		].join("\n");
		const items = parseTodos(content, "a.ts");
		expect(items.slice(0, 3)).toEqual([
			{ file: "a.ts", line: 1, text: "first" },
			{ file: "a.ts", line: 2, text: "second" },
			{ file: "a.ts", line: 3, text: "third" },
		]);
		expect(items.some((i) => i.line === 4)).toBe(false);
	});

	it("finds TODOs in tracked and untracked files but skips ignored files", async () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-todos-"));
		dirs.push(dir);
		execFileSync("git", ["init", "-q"], { cwd: dir });
		fs.writeFileSync(path.join(dir, ".gitignore"), "ignored.ts\n");
		fs.writeFileSync(path.join(dir, "ignored.ts"), "// TODO: hidden\n");
		fs.mkdirSync(path.join(dir, "src"));
		fs.writeFileSync(path.join(dir, "src", "main.ts"), "x\n// TODO: visible\n");

		const items = await findTodos(dir);
		expect(items).toEqual([{ file: "src/main.ts", line: 2, text: "visible" }]);
	});
});
