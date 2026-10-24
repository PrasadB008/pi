import { describe, expect, it } from "vitest";
import { isSortMode, sortTodos } from "../examples/extensions/todo.ts";

const todos = [
	{ id: 1, text: "write docs", done: true },
	{ id: 2, text: "add tests", done: false },
	{ id: 3, text: "fix bug", done: false },
	{ id: 4, text: "benchmark", done: true },
];

describe("todo extension sorting", () => {
	it("sorts by id", () => {
		const shuffled = [todos[2], todos[0], todos[3], todos[1]];
		expect(sortTodos(shuffled, "id").map((t) => t.id)).toEqual([1, 2, 3, 4]);
	});

	it("sorts open todos before completed, then by id", () => {
		expect(sortTodos(todos, "status").map((t) => t.id)).toEqual([2, 3, 1, 4]);
	});

	it("sorts alphabetically by text", () => {
		expect(sortTodos(todos, "text").map((t) => t.text)).toEqual(["add tests", "benchmark", "fix bug", "write docs"]);
	});

	it("does not mutate the input", () => {
		const copy = [...todos];
		sortTodos(todos, "text");
		expect(todos).toEqual(copy);
	});

	it("validates sort modes", () => {
		expect(isSortMode("status")).toBe(true);
		expect(isSortMode("nope")).toBe(false);
		expect(isSortMode("")).toBe(false);
	});
});
