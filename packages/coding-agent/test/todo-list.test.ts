import { describe, expect, it } from "vitest";
import { applyTodoCommand, type TodoItem } from "../src/core/todo-list.ts";

describe("applyTodoCommand", () => {
	it("lists an empty list", () => {
		const result = applyTodoCommand([], "");
		expect(result.isError).toBe(false);
		expect(result.message).toContain("No todos");
	});

	it("supports add, list, done, rm and clear", () => {
		let todos: TodoItem[] = [];

		todos = applyTodoCommand(todos, "add write tests").todos;
		todos = applyTodoCommand(todos, "add ship it").todos;
		expect(todos).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		todos = applyTodoCommand(todos, "done 1").todos;
		expect(applyTodoCommand(todos, "").message).toBe("Todos:\n1. [x] write tests\n2. [ ] ship it");

		todos = applyTodoCommand(todos, "rm 1").todos;
		expect(todos).toEqual([{ text: "ship it", done: false }]);

		expect(applyTodoCommand(todos, "clear").todos).toEqual([]);
	});

	it("does not mutate the input list", () => {
		const input: TodoItem[] = [{ text: "a", done: false }];
		applyTodoCommand(input, "done 1");
		expect(input).toEqual([{ text: "a", done: false }]);
	});

	it("reports errors for bad input and keeps the list", () => {
		const input: TodoItem[] = [{ text: "a", done: false }];
		for (const args of ["add", "done 2", "done x", "rm 0", "bogus"]) {
			const result = applyTodoCommand(input, args);
			expect(result.isError).toBe(true);
			expect(result.todos).toEqual(input);
		}
	});
});
