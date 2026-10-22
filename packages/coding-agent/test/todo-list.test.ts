import { describe, expect, it } from "vitest";
import { runTodoCommand, type TodoItem } from "../src/core/todo-list.ts";

describe("runTodoCommand", () => {
	it("shows a hint when the list is empty", () => {
		const items: TodoItem[] = [];
		const result = runTodoCommand(items, "");
		expect(result.isError).toBe(false);
		expect(result.message).toContain("No todos");
	});

	it("adds items with and without the add keyword", () => {
		const items: TodoItem[] = [];
		runTodoCommand(items, "write tests");
		runTodoCommand(items, "add ship it");
		expect(items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);
	});

	it("lists items with checkboxes", () => {
		const items: TodoItem[] = [
			{ text: "a", done: true },
			{ text: "b", done: false },
		];
		expect(runTodoCommand(items, "list").message).toBe("1. [x] a\n2. [ ] b");
	});

	it("marks an item done and removes an item", () => {
		const items: TodoItem[] = [
			{ text: "a", done: false },
			{ text: "b", done: false },
		];
		runTodoCommand(items, "done 2");
		expect(items[1].done).toBe(true);
		runTodoCommand(items, "rm 1");
		expect(items).toEqual([{ text: "b", done: true }]);
	});

	it("reports an error for an invalid number", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		expect(runTodoCommand(items, "done 5").isError).toBe(true);
		expect(runTodoCommand(items, "rm x").isError).toBe(true);
		expect(items).toHaveLength(1);
	});

	it("rejects an empty add and clears the list", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		expect(runTodoCommand(items, "add").isError).toBe(true);
		runTodoCommand(items, "clear");
		expect(items).toEqual([]);
	});
});
