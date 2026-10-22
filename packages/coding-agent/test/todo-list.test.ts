import { describe, expect, it } from "vitest";
import { applyTodoCommand, formatTodoList, TODO_USAGE, type TodoItem } from "../src/core/todo-list.ts";

describe("applyTodoCommand", () => {
	it("supports add, list, done, remove and clear", () => {
		let items: TodoItem[] = [];
		items = applyTodoCommand(items, "add write tests").items;
		items = applyTodoCommand(items, "add ship it").items;
		expect(items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		items = applyTodoCommand(items, "done 1").items;
		expect(items[0].done).toBe(true);
		expect(formatTodoList(items)).toBe("1. [x] write tests\n2. [ ] ship it");

		expect(applyTodoCommand(items, "").items).toEqual(items);

		items = applyTodoCommand(items, "remove 1").items;
		expect(items).toEqual([{ text: "ship it", done: false }]);

		expect(applyTodoCommand(items, "clear").items).toEqual([]);
	});

	it("reports errors and leaves items unchanged", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		expect(applyTodoCommand(items, "add").error).toBe(TODO_USAGE);
		expect(applyTodoCommand(items, "done 2").error).toContain("Invalid todo number");
		expect(applyTodoCommand(items, "remove x").error).toContain("Invalid todo number");
		expect(applyTodoCommand(items, "bogus").error).toBe(TODO_USAGE);
		expect(applyTodoCommand(items, "done 2").items).toEqual(items);
	});

	it("does not mutate the input", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		applyTodoCommand(items, "done 1");
		expect(items[0].done).toBe(false);
	});

	it("formats an empty list", () => {
		expect(formatTodoList([])).toContain("No todos");
	});
});
