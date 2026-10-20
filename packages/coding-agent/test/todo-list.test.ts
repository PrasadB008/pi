import { describe, expect, it } from "vitest";
import { applyTodoCommand, formatTodoList, type TodoItem } from "../src/core/todo-list.ts";

describe("applyTodoCommand", () => {
	it("supports add, done, remove and clear", () => {
		let items: TodoItem[] = [];
		items = applyTodoCommand(items, "add write tests").items;
		items = applyTodoCommand(items, "add ship it").items;
		expect(formatTodoList(items)).toBe("1. [ ] write tests\n2. [ ] ship it");

		items = applyTodoCommand(items, "done 1").items;
		expect(formatTodoList(items)).toBe("1. [x] write tests\n2. [ ] ship it");

		items = applyTodoCommand(items, "remove 1").items;
		expect(formatTodoList(items)).toBe("1. [ ] ship it");

		items = applyTodoCommand(items, "clear").items;
		expect(items).toEqual([]);
		expect(formatTodoList(items)).toBe("No todos. Use /todo add <text>.");
	});

	it("does not mutate the input list", () => {
		const original: TodoItem[] = [{ text: "a", done: false }];
		applyTodoCommand(original, "done 1");
		expect(original).toEqual([{ text: "a", done: false }]);
	});

	it("reports errors and keeps the list", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		expect(applyTodoCommand(items, "add").error).toContain("Usage");
		expect(applyTodoCommand(items, "bogus").error).toContain("Usage");
		expect(applyTodoCommand(items, "done 2").error).toContain("between 1 and 1");
		expect(applyTodoCommand(items, "remove abc").items).toEqual(items);
	});
});
