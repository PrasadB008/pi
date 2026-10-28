import { describe, expect, it } from "vitest";
import { formatTodosMarkdown, parseRipgrepTodoLine } from "../src/core/todos.ts";

function match(path: string, lineNumber: number, text: string): string {
	return JSON.stringify({ type: "match", data: { path: { text: path }, line_number: lineNumber, lines: { text } } });
}

describe("parseRipgrepTodoLine", () => {
	it("parses a match and makes the path relative to cwd", () => {
		const item = parseRipgrepTodoLine(match("/work/proj/src/a.ts", 12, "\t// TODO: fix this\n"), "/work/proj");
		expect(item).toEqual({ file: "src/a.ts", line: 12, kind: "TODO", text: "// TODO: fix this" });
	});

	it("strips a leading ./ and detects FIXME", () => {
		const item = parseRipgrepTodoLine(match("./b.ts", 3, "// FIXME broken\n"), "/work/proj");
		expect(item).toMatchObject({ file: "b.ts", kind: "FIXME" });
	});

	it("ignores non-match events and malformed lines", () => {
		expect(parseRipgrepTodoLine(JSON.stringify({ type: "summary", data: {} }), "/x")).toBeUndefined();
		expect(parseRipgrepTodoLine("not json", "/x")).toBeUndefined();
	});
});

describe("formatTodosMarkdown", () => {
	it("reports when nothing is found", () => {
		expect(formatTodosMarkdown({ items: [], limitReached: false })).toBe("No TODO or FIXME comments found.");
	});

	it("groups items by file with a summary", () => {
		const text = formatTodosMarkdown({
			items: [
				{ file: "a.ts", line: 1, kind: "TODO", text: "// TODO one" },
				{ file: "a.ts", line: 5, kind: "TODO", text: "// TODO two" },
				{ file: "b.ts", line: 2, kind: "FIXME", text: "// FIXME three" },
			],
			limitReached: false,
		});
		expect(text).toContain("3 TODO/FIXME comments across 2 files.");
		expect(text).toContain("**a.ts**");
		expect(text).toContain("- `5` // TODO two");
		expect(text).toContain("**b.ts**");
	});

	it("mentions the limit when reached", () => {
		const text = formatTodosMarkdown({
			items: [{ file: "a.ts", line: 1, kind: "TODO", text: "// TODO" }],
			limitReached: true,
		});
		expect(text).toContain("limit reached");
	});
});
