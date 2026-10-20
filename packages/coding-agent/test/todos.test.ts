import { describe, expect, it } from "vitest";
import { SessionManager } from "../src/core/session-manager.ts";
import { applyTodoCommand, getTodosFromBranch, TODO_ENTRY_TYPE, type TodoItem } from "../src/core/todos.ts";

describe("applyTodoCommand", () => {
	it("lists an empty list without changes", () => {
		const result = applyTodoCommand([], "");
		expect(result.changed).toBe(false);
		expect(result.message).toContain("No todos");
	});

	it("adds items with and without the add keyword", () => {
		const first = applyTodoCommand([], "write tests");
		const second = applyTodoCommand(first.todos, "add ship it");
		expect(second.todos).toEqual([
			{ id: 1, text: "write tests", done: false },
			{ id: 2, text: "ship it", done: false },
		]);
	});

	it("marks done, reopens, and removes items by id", () => {
		const todos: TodoItem[] = [
			{ id: 1, text: "a", done: false },
			{ id: 2, text: "b", done: false },
		];
		const done = applyTodoCommand(todos, "done 2");
		expect(done.todos[1].done).toBe(true);
		expect(applyTodoCommand(done.todos, "undo 2").todos[1].done).toBe(false);
		expect(applyTodoCommand(todos, "rm 1").todos).toEqual([{ id: 2, text: "b", done: false }]);
	});

	it("does not reuse ids after removal", () => {
		const todos: TodoItem[] = [
			{ id: 1, text: "a", done: false },
			{ id: 2, text: "b", done: false },
		];
		const removed = applyTodoCommand(todos, "rm 2");
		expect(applyTodoCommand(removed.todos, "c").todos[1].id).toBe(2);
	});

	it("reports unknown ids as errors", () => {
		const result = applyTodoCommand([], "done 5");
		expect(result.isError).toBe(true);
		expect(result.changed).toBe(false);
	});

	it("clears the list", () => {
		const result = applyTodoCommand([{ id: 1, text: "a", done: false }], "clear");
		expect(result.todos).toEqual([]);
		expect(result.changed).toBe(true);
	});
});

describe("getTodosFromBranch", () => {
	it("reads the latest snapshot on the current branch", () => {
		const manager = SessionManager.inMemory();
		manager.appendCustomEntry(TODO_ENTRY_TYPE, { todos: [{ id: 1, text: "a", done: false }] });
		manager.appendCustomEntry(TODO_ENTRY_TYPE, {
			todos: [
				{ id: 1, text: "a", done: true },
				{ id: 2, text: "b", done: false },
			],
		});
		expect(getTodosFromBranch(manager.getBranch())).toHaveLength(2);
	});

	it("returns an empty list when no todo entry exists", () => {
		expect(getTodosFromBranch(SessionManager.inMemory().getBranch())).toEqual([]);
	});
});
