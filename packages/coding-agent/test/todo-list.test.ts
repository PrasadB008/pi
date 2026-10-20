import { describe, expect, it } from "vitest";
import { applyTodoCommand, formatTodos, type TodoItem } from "../src/core/todo-list.ts";

function apply(todos: TodoItem[], args: string): TodoItem[] {
	const result = applyTodoCommand(todos, args);
	if (!result.ok) throw new Error(result.error);
	return result.todos;
}

describe("applyTodoCommand", () => {
	it("adds, completes, and clears items", () => {
		let todos = apply([], "add write tests");
		todos = apply(todos, "add ship it");
		expect(todos).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		todos = apply(todos, "done 2");
		expect(formatTodos(todos)).toBe("1. [ ] write tests\n2. [x] ship it");

		expect(apply(todos, "clear")).toEqual([]);
	});

	it("lists without changing the list", () => {
		const todos = [{ text: "a", done: false }];
		expect(apply(todos, "")).toEqual(todos);
	});

	it("does not mutate its input", () => {
		const todos = [{ text: "a", done: false }];
		apply(todos, "done 1");
		expect(todos[0]?.done).toBe(false);
	});

	it("rejects invalid input", () => {
		const todos = [{ text: "a", done: false }];
		expect(applyTodoCommand(todos, "add").ok).toBe(false);
		expect(applyTodoCommand(todos, "done 2").ok).toBe(false);
		expect(applyTodoCommand(todos, "done x").ok).toBe(false);
		expect(applyTodoCommand(todos, "bogus").ok).toBe(false);
	});
});

describe("formatTodos", () => {
	it("shows a hint when empty", () => {
		expect(formatTodos([])).toBe("No todos. Use /todo add <text>");
	});
});
