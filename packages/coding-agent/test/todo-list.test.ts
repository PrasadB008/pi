import { describe, expect, test } from "vitest";
import { applyTodoCommand, type TodoItem } from "../src/core/todo-list.ts";

function run(items: TodoItem[], args: string) {
	return applyTodoCommand(items, args);
}

describe("applyTodoCommand", () => {
	test("shows a hint when the list is empty", () => {
		const result = run([], "");
		expect(result.isError).toBe(false);
		expect(result.items).toEqual([]);
		expect(result.message).toContain("No todos");
	});

	test("adds, lists, toggles, removes and clears items", () => {
		let result = run([], "add write tests");
		expect(result.items).toEqual([{ text: "write tests", done: false }]);
		expect(result.message).toBe("1. [ ] write tests");

		result = run(result.items, "add ship it");
		expect(result.items).toHaveLength(2);

		result = run(result.items, "done 1");
		expect(result.items[0]).toEqual({ text: "write tests", done: true });
		expect(run(result.items, "list").message).toBe("1. [x] write tests\n2. [ ] ship it");

		result = run(result.items, "done 1");
		expect(result.items[0].done).toBe(false);

		result = run(result.items, "rm 1");
		expect(result.items).toEqual([{ text: "ship it", done: false }]);

		result = run(result.items, "clear");
		expect(result.items).toEqual([]);
		expect(result.isError).toBe(false);
	});

	test("does not mutate the input list", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		run(items, "done 1");
		run(items, "rm 1");
		expect(items).toEqual([{ text: "a", done: false }]);
	});

	test("reports errors for bad input and leaves the list unchanged", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		for (const args of ["add", "done", "done x", "done 2", "rm 0", "rm 1 2", "bogus"]) {
			const result = run(items, args);
			expect(result.isError, args).toBe(true);
			expect(result.items, args).toBe(items);
		}
	});
});
