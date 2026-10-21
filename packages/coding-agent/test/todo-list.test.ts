import { describe, expect, it } from "vitest";
import { applyTodoCommand, TODO_USAGE, type TodoItem } from "../src/core/todo-list.ts";

describe("applyTodoCommand", () => {
	it("adds, completes, removes and clears todos", () => {
		let todos: TodoItem[] = [];

		todos = applyTodoCommand(todos, "add write tests").todos;
		todos = applyTodoCommand(todos, "add ship it").todos;
		expect(todos).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		todos = applyTodoCommand(todos, "done 1").todos;
		expect(todos[0].done).toBe(true);
		expect(todos[1].done).toBe(false);

		todos = applyTodoCommand(todos, "remove 1").todos;
		expect(todos).toEqual([{ text: "ship it", done: false }]);

		expect(applyTodoCommand(todos, "clear").todos).toEqual([]);
	});

	it("lists without changing and does not mutate the input", () => {
		const input: TodoItem[] = [{ text: "a", done: false }];
		expect(applyTodoCommand(input, "").todos).toEqual(input);
		applyTodoCommand(input, "done 1");
		expect(input[0].done).toBe(false);
	});

	it("reports errors for invalid input", () => {
		const input: TodoItem[] = [{ text: "a", done: false }];
		expect(applyTodoCommand(input, "add").error).toBe(TODO_USAGE);
		expect(applyTodoCommand(input, "bogus").error).toBe(TODO_USAGE);
		expect(applyTodoCommand(input, "done 2").error).toContain("Invalid todo number: 2");
		expect(applyTodoCommand(input, "remove x").error).toContain("Invalid todo number: x");
		expect(applyTodoCommand(input, "done").error).toContain("(missing)");
	});
});
