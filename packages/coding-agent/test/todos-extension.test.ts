import { describe, expect, it } from "vitest";
import { findTodos, formatTodo } from "../../../.pi/extensions/todos.ts";

describe("/todos extension scanner", () => {
	it("finds TODO/FIXME markers with line numbers and text", () => {
		const content = [
			"const a = 1;",
			"// TODO: handle errors",
			"/* FIXME(bob) tidy up */",
			"const todoList = []; // not a marker",
			"# HACK temporary workaround",
		].join("\n");

		const items = findTodos("src/a.ts", content);

		expect(items.map((i) => [i.line, i.marker, i.text])).toEqual([
			[2, "TODO", "handle errors"],
			[3, "FIXME", "tidy up"],
			[5, "HACK", "temporary workaround"],
		]);
	});

	it("formats an item as path:line plus text", () => {
		expect(formatTodo({ file: "a.ts", line: 4, marker: "TODO", text: "" })).toBe("a.ts:4  TODO: (no description)");
		expect(formatTodo({ file: "a.ts", line: 4, marker: "TODO", text: "x" })).toBe("a.ts:4  TODO: x");
	});
});
