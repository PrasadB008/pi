import { describe, expect, it } from "vitest";
import { applyTodoCommand, type TodoItem } from "../src/core/todo.ts";

describe("applyTodoCommand", () => {
	it("shows a hint when the list is empty", () => {
		const items: TodoItem[] = [];
		const result = applyTodoCommand(items, "");
		expect(result.isError).toBe(false);
		expect(result.message).toContain("No todos");
	});

	it("adds, lists, completes, reopens and removes items", () => {
		const items: TodoItem[] = [];
		expect(applyTodoCommand(items, "add write tests").message).toBe("Added todo 1: write tests");
		applyTodoCommand(items, "add  ship it ");
		expect(items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		expect(applyTodoCommand(items, "done 1").message).toBe("Completed todo 1: write tests");
		expect(applyTodoCommand(items, "").message).toBe("1. [x] write tests\n2. [ ] ship it");
		expect(applyTodoCommand(items, "done 1").message).toBe("Reopened todo 1: write tests");

		expect(applyTodoCommand(items, "rm 1").message).toBe("Removed todo 1: write tests");
		expect(items).toEqual([{ text: "ship it", done: false }]);

		applyTodoCommand(items, "clear");
		expect(items).toEqual([]);
	});

	it("reports errors for bad input without changing the list", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		expect(applyTodoCommand(items, "add").isError).toBe(true);
		expect(applyTodoCommand(items, "done").isError).toBe(true);
		expect(applyTodoCommand(items, "done 2").isError).toBe(true);
		expect(applyTodoCommand(items, "rm 0").isError).toBe(true);
		expect(applyTodoCommand(items, "rm x").isError).toBe(true);
		expect(applyTodoCommand(items, "bogus").isError).toBe(true);
		expect(items).toEqual([{ text: "a", done: false }]);
	});
});
