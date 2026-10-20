import { describe, expect, it } from "vitest";
import { runTodoCommand, type TodoItem } from "../src/core/todo-list.ts";

describe("runTodoCommand", () => {
	it("shows an empty list hint", () => {
		const items: TodoItem[] = [];
		const result = runTodoCommand("/todo", items);
		expect(result.isError).toBe(false);
		expect(result.message).toContain("No todos");
	});

	it("adds, completes, lists and removes items", () => {
		const items: TodoItem[] = [];
		runTodoCommand("/todo add write tests", items);
		runTodoCommand("/todo add ship it", items);
		expect(items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		const done = runTodoCommand("/todo done 1", items);
		expect(done.message).toBe("1. [x] write tests\n2. [ ] ship it");

		runTodoCommand("/todo undone 1", items);
		expect(items[0].done).toBe(false);

		const removed = runTodoCommand("/todo remove 2", items);
		expect(removed.message).toBe("Removed todo: ship it");
		expect(items).toHaveLength(1);
	});

	it("clears all items", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		runTodoCommand("/todo clear", items);
		expect(items).toHaveLength(0);
	});

	it("reports errors for bad input", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		expect(runTodoCommand("/todo add", items).isError).toBe(true);
		expect(runTodoCommand("/todo done 5", items).isError).toBe(true);
		expect(runTodoCommand("/todo done x", items).isError).toBe(true);
		expect(runTodoCommand("/todo bogus", items).isError).toBe(true);
		expect(items).toHaveLength(1);
	});
});
