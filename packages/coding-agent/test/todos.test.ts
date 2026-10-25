import { describe, expect, test } from "vitest";
import { formatTodosMarkdown, parseTodoLine } from "../src/core/todos.ts";

describe("parseTodoLine", () => {
	test("extracts tag and text from line comments", () => {
		expect(parseTodoLine("a.ts", 3, "\t// TODO: handle errors")).toEqual({
			file: "a.ts",
			line: 3,
			tag: "TODO",
			text: "handle errors",
		});
		expect(parseTodoLine("a.ts", 4, "x = 1 # FIXME(bob) - wrong")?.text).toBe("wrong");
	});

	test("strips block comment terminators", () => {
		expect(parseTodoLine("a.css", 1, "/* HACK work around bug */")?.text).toBe("work around bug");
		expect(parseTodoLine("a.html", 1, "<!-- TODO later -->")?.text).toBe("later");
	});

	test("ignores lines without a whole-word marker", () => {
		expect(parseTodoLine("a.ts", 1, "const todos = []")).toBeUndefined();
		expect(parseTodoLine("a.ts", 1, "TODOS are listed")).toBeUndefined();
	});

	test("truncates very long text", () => {
		const item = parseTodoLine("a.ts", 1, `// TODO ${"x".repeat(500)}`);
		expect(item?.text.length).toBeLessThan(200);
		expect(item?.text.endsWith("...")).toBe(true);
	});
});

describe("formatTodosMarkdown", () => {
	test("reports when nothing is found", () => {
		expect(formatTodosMarkdown({ items: [], limitReached: false })).toBe("No TODO comments found.");
	});

	test("groups items by file and notes the limit", () => {
		const out = formatTodosMarkdown({
			items: [
				{ file: "a.ts", line: 1, tag: "TODO", text: "one" },
				{ file: "b.ts", line: 2, tag: "FIXME", text: "two" },
				{ file: "a.ts", line: 9, tag: "HACK", text: "three" },
			],
			limitReached: true,
		});
		expect(out).toContain("### a.ts\n\n- `1` **TODO** one\n- `9` **HACK** three");
		expect(out).toContain("### b.ts\n\n- `2` **FIXME** two");
		expect(out).toContain("Showing the first 3 items.");
	});
});
