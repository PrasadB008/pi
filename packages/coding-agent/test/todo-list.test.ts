import { describe, expect, it } from "vitest";
import { runTodoCommand, type TodoItem } from "../src/core/todo-list.ts";

describe("runTodoCommand", () => {
	it("supports add, list, done, rm and clear", () => {
		let items: TodoItem[] = [];

		let result = runTodoCommand(items, "");
		expect(result.kind).toBe("status");
		expect(result.message).toContain("No todos");

		result = runTodoCommand(items, "write tests");
		items = result.items;
		result = runTodoCommand(items, "ship it");
		items = result.items;
		expect(items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		result = runTodoCommand(items, "");
		expect(result.kind).toBe("list");
		expect(result.message).toBe("1. [ ] write tests\n2. [ ] ship it");

		result = runTodoCommand(items, "done 1");
		items = result.items;
		expect(items[0].done).toBe(true);
		expect(runTodoCommand(items, "").message).toBe("1. [x] write tests\n2. [ ] ship it");

		result = runTodoCommand(items, "rm 1");
		items = result.items;
		expect(items).toEqual([{ text: "ship it", done: false }]);

		result = runTodoCommand(items, "clear");
		expect(result.items).toEqual([]);
	});

	it("warns on invalid indexes and missing arguments without changing the list", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];

		for (const args of ["done 5", "rm 0", "done", "rm"]) {
			const result = runTodoCommand(items, args);
			expect(result.kind).toBe("warning");
			expect(result.items).toEqual(items);
		}
	});

	it("does not mutate the input list", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		runTodoCommand(items, "done 1");
		expect(items[0].done).toBe(false);
	});
});
