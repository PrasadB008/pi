import { describe, expect, test } from "vitest";
import { applyTodoCommand, TODO_USAGE, type TodoItem } from "../src/core/todo-list.ts";

describe("applyTodoCommand", () => {
	test("add, done, remove and clear", () => {
		let items: TodoItem[] = [];

		items = applyTodoCommand(items, "add write tests").items;
		items = applyTodoCommand(items, "add ship it").items;
		expect(items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		items = applyTodoCommand(items, "done 1").items;
		expect(items[0].done).toBe(true);
		expect(items[1].done).toBe(false);

		items = applyTodoCommand(items, "remove 1").items;
		expect(items).toEqual([{ text: "ship it", done: false }]);

		expect(applyTodoCommand(items, "clear").items).toEqual([]);
	});

	test("empty args leave the list unchanged", () => {
		const items = [{ text: "a", done: false }];
		const result = applyTodoCommand(items, "  ");
		expect(result.items).toEqual(items);
		expect(result.error).toBeUndefined();
	});

	test("does not mutate the input list", () => {
		const items = [{ text: "a", done: false }];
		applyTodoCommand(items, "done 1");
		expect(items[0].done).toBe(false);
	});

	test("reports errors and keeps items", () => {
		const items = [{ text: "a", done: false }];
		expect(applyTodoCommand(items, "add").error).toBe(TODO_USAGE);
		expect(applyTodoCommand(items, "bogus").error).toBe(TODO_USAGE);
		for (const args of ["done", "done 0", "done 2", "done x", "remove 5"]) {
			const result = applyTodoCommand(items, args);
			expect(result.error).toContain("Invalid todo number");
			expect(result.items).toEqual(items);
		}
	});
});
