import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { applyTodoCommand, type TodoItem } from "../src/core/todo-list.ts";

describe("applyTodoCommand", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("reports an empty list with usage", () => {
		const result = applyTodoCommand([], "");
		expect(result.kind).toBe("status");
		expect(result.message).toContain("No todo items");
		expect(result.message).toContain("/todo done <n>");
	});

	it("adds, lists, completes and clears items", () => {
		let items: TodoItem[] = [];

		let result = applyTodoCommand(items, "write tests");
		items = result.items;
		expect(result.message).toBe("Todo added (1): write tests");
		result = applyTodoCommand(items, "  ship it  ");
		items = result.items;
		expect(items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		result = applyTodoCommand(items, "done 1");
		items = result.items;
		expect(result.message).toBe("Done: write tests");

		result = applyTodoCommand(items, "");
		expect(result.kind).toBe("list");
		expect(result.message).toBe("Todo\n\n1. [x] write tests\n2. [ ] ship it");

		result = applyTodoCommand(items, "clear");
		expect(result.items).toEqual([]);
		expect(result.message).toBe("Todo list cleared");
	});

	it("returns an error for an unknown item and leaves the list unchanged", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		for (const args of ["done 0", "done 2"]) {
			const result = applyTodoCommand(items, args);
			expect(result.kind).toBe("error");
			expect(result.items).toEqual(items);
		}
	});

	it("does not modify the input list", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		applyTodoCommand(items, "done 1");
		applyTodoCommand(items, "b");
		expect(items).toEqual([{ text: "a", done: false }]);
	});
});
