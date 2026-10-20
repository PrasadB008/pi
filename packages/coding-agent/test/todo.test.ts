import { describe, expect, it } from "vitest";
import { applyTodoCommand, formatTodoLines, type TodoItem } from "../src/core/todo.ts";

describe("applyTodoCommand", () => {
	it("adds, lists, marks done and clears items", () => {
		let items: TodoItem[] = [];

		items = applyTodoCommand(items, "write tests").items;
		items = applyTodoCommand(items, "  ship it  ").items;
		expect(formatTodoLines(items)).toEqual(["1. [ ] write tests", "2. [ ] ship it"]);

		// Empty args only shows the list.
		expect(applyTodoCommand(items, "").items).toEqual(items);

		const done = applyTodoCommand(items, "done 2");
		expect(done.error).toBeUndefined();
		expect(formatTodoLines(done.items)).toEqual(["1. [ ] write tests", "2. [x] ship it"]);
		// Input list is not mutated.
		expect(items[1].done).toBe(false);

		const cleared = applyTodoCommand(done.items, "clear");
		expect(cleared.cleared).toBe(true);
		expect(cleared.items).toEqual([]);
	});

	it("reports an error for an unknown item number", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		for (const args of ["done 0", "done 2"]) {
			const result = applyTodoCommand(items, args);
			expect(result.error).toBe(`No todo item ${args.slice(5)}`);
			expect(result.items).toEqual(items);
		}
	});
});
