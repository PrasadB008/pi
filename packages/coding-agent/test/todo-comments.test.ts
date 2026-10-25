import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoComments, parseTodoGrepOutput } from "../src/core/todo-comments.ts";

describe("todo comments", () => {
	it("parses git grep output into todo comments", () => {
		const output = [
			"src/a.ts:12:\t// TODO: handle errors",
			"src/a.ts:30:/* FIXME(bob) tidy up */",
			"docs/b.md:3:<!-- XXX revisit -->",
			"garbage line",
		].join("\n");

		expect(parseTodoGrepOutput(output)).toEqual([
			{ file: "src/a.ts", line: 12, tag: "TODO", text: "handle errors" },
			{ file: "src/a.ts", line: 30, tag: "FIXME", text: "bob) tidy up" },
			{ file: "docs/b.md", line: 3, tag: "XXX", text: "revisit" },
		]);
	});

	it("formats an empty result", () => {
		expect(formatTodoComments([])).toBe("No TODO comments found.");
	});

	it("groups formatted results by file", () => {
		const markdown = formatTodoComments([
			{ file: "a.ts", line: 1, tag: "TODO", text: "one" },
			{ file: "a.ts", line: 2, tag: "FIXME", text: "two" },
			{ file: "b.ts", line: 5, tag: "TODO", text: "three" },
		]);
		expect(markdown).toContain("3 TODO comment(s) in 2 file(s)");
		expect(markdown).toContain("**a.ts**\n- `1` **TODO** one\n- `2` **FIXME** two");
		expect(markdown).toContain("**b.ts**\n- `5` **TODO** three");
	});

	it("registers /todos as a built-in command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todos")).toBe(true);
	});
});
