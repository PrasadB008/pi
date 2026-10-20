import { describe, expect, it } from "vitest";
import { runTodoCommand, TODO_USAGE, type TodoItem } from "../src/core/todo-list.ts";

describe("runTodoCommand", () => {
	it("shows an empty list hint", () => {
		const result = runTodoCommand([], "");
		expect(result.isError).toBe(false);
		expect(result.message).toContain("No todos");
	});

	it("adds, lists, completes and clears items", () => {
		let items: TodoItem[] = [];

		let result = runTodoCommand(items, "add write tests");
		items = result.items;
		expect(result.message).toBe("Added todo 1: write tests");

		result = runTodoCommand(items, "add ship it");
		items = result.items;
		expect(items).toHaveLength(2);

		result = runTodoCommand(items, "done 2");
		items = result.items;
		expect(result.message).toBe("Completed todo 2: ship it");

		result = runTodoCommand(items, "");
		expect(result.message).toBe("1. [ ] write tests\n2. [x] ship it");

		result = runTodoCommand(items, "clear");
		expect(result.items).toEqual([]);
		expect(result.isError).toBe(false);
	});

	it("does not mutate the input list", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		runTodoCommand(items, "done 1");
		runTodoCommand(items, "add b");
		expect(items).toEqual([{ text: "a", done: false }]);
	});

	it("reports an error for an unknown index", () => {
		const result = runTodoCommand([{ text: "a", done: false }], "done 5");
		expect(result.isError).toBe(true);
		expect(result.message).toBe("No todo 5");
	});

	it("reports usage for invalid input", () => {
		for (const args of ["add", "done", "done x", "clear all", "bogus"]) {
			const result = runTodoCommand([], args);
			expect(result.isError).toBe(true);
			expect(result.message).toBe(TODO_USAGE);
		}
	});
});
