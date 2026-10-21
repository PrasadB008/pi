import { describe, expect, it } from "vitest";
import { applyTodoCommand, formatTodoList, TODO_USAGE, type TodoItem } from "../src/core/todo-list.ts";

describe("todo list", () => {
	it("adds, lists, completes and clears items", () => {
		const todos: TodoItem[] = [];
		expect(formatTodoList(todos)).toBe("No todos");

		expect(applyTodoCommand(todos, "add write tests")).toEqual({ ok: true });
		expect(applyTodoCommand(todos, "ship it")).toEqual({ ok: true });
		expect(formatTodoList(todos)).toBe("1. [ ] write tests\n2. [ ] ship it");

		expect(applyTodoCommand(todos, "done 1")).toEqual({ ok: true });
		expect(formatTodoList(todos)).toBe("1. [x] write tests\n2. [ ] ship it");

		expect(applyTodoCommand(todos, "clear")).toEqual({ ok: true });
		expect(todos).toEqual([]);
	});

	it("leaves the list unchanged when no arguments are given", () => {
		const todos: TodoItem[] = [{ text: "a", done: false }];
		expect(applyTodoCommand(todos, "  ")).toEqual({ ok: true });
		expect(todos).toEqual([{ text: "a", done: false }]);
	});

	it("reports errors for bad input", () => {
		const todos: TodoItem[] = [{ text: "a", done: false }];
		expect(applyTodoCommand(todos, "done 5")).toEqual({ ok: false, error: "No todo number 5" });
		expect(applyTodoCommand(todos, "done x")).toEqual({ ok: false, error: TODO_USAGE });
		expect(applyTodoCommand(todos, "add")).toEqual({ ok: false, error: TODO_USAGE });
		expect(todos).toEqual([{ text: "a", done: false }]);
	});
});
