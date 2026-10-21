import { describe, expect, it } from "vitest";
import { applyTodoCommand, formatTodoLines, type TodoItem } from "../src/core/todo.ts";

describe("applyTodoCommand", () => {
	it("adds, lists, completes and clears todos", () => {
		let todos: TodoItem[] = [];

		const listEmpty = applyTodoCommand(todos, "");
		expect(listEmpty.changed).toBe(false);
		expect(listEmpty.todos).toEqual([]);

		for (const text of ["write tests", "update docs"]) {
			const added = applyTodoCommand(todos, text);
			expect(added.changed).toBe(true);
			todos = added.todos;
		}
		expect(formatTodoLines(todos)).toEqual(["1. [ ] write tests", "2. [ ] update docs"]);

		const done = applyTodoCommand(todos, "done 2");
		expect(done.changed).toBe(true);
		expect(formatTodoLines(done.todos)).toEqual(["1. [ ] write tests", "2. [x] update docs"]);
		// Input list is not mutated.
		expect(todos[1].done).toBe(false);

		const cleared = applyTodoCommand(done.todos, "clear");
		expect(cleared.changed).toBe(true);
		expect(cleared.todos).toEqual([]);
	});

	it("reports an error for a missing or out-of-range number", () => {
		const todos: TodoItem[] = [{ text: "a", done: false }];

		expect(applyTodoCommand(todos, "done").error).toBe("Usage: /todo done <n>");
		expect(applyTodoCommand(todos, "done x").error).toBe("Usage: /todo done <n>");
		expect(applyTodoCommand(todos, "done 0").error).toBe("No todo number 0");
		const outOfRange = applyTodoCommand(todos, "done 2");
		expect(outOfRange.error).toBe("No todo number 2");
		expect(outOfRange.changed).toBe(false);
		expect(outOfRange.todos).toBe(todos);
	});

	it("treats text that merely starts with 'done' as a new item", () => {
		const result = applyTodoCommand([], "donut run");
		expect(result.todos).toEqual([{ text: "donut run", done: false }]);
	});
});
