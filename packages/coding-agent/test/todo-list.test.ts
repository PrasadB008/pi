import { describe, expect, it } from "vitest";
import { applyTodoCommand, formatTodoLines, type TodoItem } from "../src/core/todo-list.ts";

describe("applyTodoCommand", () => {
	it("adds, marks done, removes and clears todos", () => {
		let todos: TodoItem[] = [];

		todos = applyTodoCommand(todos, "write tests").todos;
		todos = applyTodoCommand(todos, "ship it").todos;
		expect(formatTodoLines(todos)).toEqual(["1. [ ] write tests", "2. [ ] ship it"]);

		todos = applyTodoCommand(todos, "done 1").todos;
		expect(formatTodoLines(todos)).toEqual(["1. [x] write tests", "2. [ ] ship it"]);

		todos = applyTodoCommand(todos, "rm 1").todos;
		expect(formatTodoLines(todos)).toEqual(["1. [ ] ship it"]);

		const cleared = applyTodoCommand(todos, "clear");
		expect(cleared.todos).toEqual([]);
		expect(cleared.notice).toBe("Todos cleared");
	});

	it("lists without changing the list when no arguments are given", () => {
		const todos: TodoItem[] = [{ text: "a", done: false }];
		const result = applyTodoCommand(todos, "  ");
		expect(result.todos).toEqual(todos);
		expect(result.error).toBeUndefined();
	});

	it("reports errors and leaves the list unchanged", () => {
		const todos: TodoItem[] = [{ text: "a", done: false }];
		expect(applyTodoCommand(todos, "done 5")).toEqual({ todos, error: "No todo #5" });
		expect(applyTodoCommand(todos, "rm 0").error).toBe("No todo #0");
		expect(applyTodoCommand(todos, "done").error).toBe("Usage: /todo done <n> | /todo rm <n>");
		expect(applyTodoCommand(todos, "rm abc").error).toBe("Usage: /todo done <n> | /todo rm <n>");
	});

	it("does not modify the input list", () => {
		const todos: TodoItem[] = [{ text: "a", done: false }];
		applyTodoCommand(todos, "done 1");
		expect(todos[0].done).toBe(false);
	});
});
