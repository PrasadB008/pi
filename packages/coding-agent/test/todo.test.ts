import { describe, expect, it } from "vitest";
import { applyTodoCommand, formatTodoList, type TodoItem } from "../src/core/todo.ts";

describe("applyTodoCommand", () => {
	it("adds, marks done, lists and clears items", () => {
		let items: TodoItem[] = [];

		items = applyTodoCommand(items, "write tests").items;
		items = applyTodoCommand(items, "  ship it  ").items;
		expect(items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		const done = applyTodoCommand(items, "done 1");
		expect(done.error).toBeUndefined();
		expect(done.items[0]).toEqual({ text: "write tests", done: true });
		expect(formatTodoList(done.items)).toBe("Todo:\n1. [x] write tests\n2. [ ] ship it");

		const cleared = applyTodoCommand(done.items, "clear");
		expect(cleared.cleared).toBe(true);
		expect(cleared.items).toEqual([]);
	});

	it("lists without changing items when the argument is empty", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		expect(applyTodoCommand(items, "").items).toEqual(items);
	});

	it("reports an error for an unknown item and does not mutate the input", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		const result = applyTodoCommand(items, "done 5");
		expect(result.error).toBe("No todo item 5");
		applyTodoCommand(items, "done 1");
		expect(items[0].done).toBe(false);
	});
});
