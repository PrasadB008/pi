import { describe, expect, it } from "vitest";
import { applyTodoCommand, parseTodoItems, type TodoItem } from "../src/core/todo-list.ts";

function run(items: TodoItem[], args: string) {
	const result = applyTodoCommand(items, args);
	if (!result.ok) throw new Error(result.error);
	return result;
}

describe("todo list", () => {
	it("supports add, done, remove and clear", () => {
		let items: TodoItem[] = [];
		items = run(items, "add write tests").items;
		items = run(items, "add ship it").items;
		expect(items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		items = run(items, "done 1").items;
		expect(items[0]?.done).toBe(true);
		items = run(items, "done 1").items;
		expect(items[0]?.done).toBe(false);

		items = run(items, "remove 1").items;
		expect(items).toEqual([{ text: "ship it", done: false }]);

		items = run(items, "clear").items;
		expect(items).toEqual([]);
	});

	it("lists without changing when no arguments are given", () => {
		const items = [{ text: "a", done: false }];
		const result = run(items, "  ");
		expect(result.changed).toBe(false);
		expect(result.items).toEqual(items);
	});

	it("rejects bad input without changing the list", () => {
		const items = [{ text: "a", done: false }];
		expect(applyTodoCommand(items, "add").ok).toBe(false);
		expect(applyTodoCommand(items, "done 2").ok).toBe(false);
		expect(applyTodoCommand(items, "remove 0").ok).toBe(false);
		expect(applyTodoCommand(items, "remove abc").ok).toBe(false);
		expect(applyTodoCommand(items, "bogus").ok).toBe(false);
		expect(items).toEqual([{ text: "a", done: false }]);
	});

	it("parses persisted data and drops malformed items", () => {
		expect(parseTodoItems(undefined)).toEqual([]);
		expect(parseTodoItems({ items: "nope" })).toEqual([]);
		expect(parseTodoItems({ items: [{ text: "a", done: true }, { text: 1 }, null, { text: "b" }] })).toEqual([
			{ text: "a", done: true },
			{ text: "b", done: false },
		]);
	});
});
