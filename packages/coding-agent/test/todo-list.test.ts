import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { applyTodoCommand, type TodoItem } from "../src/core/todo-list.ts";

describe("applyTodoCommand", () => {
	it("adds, lists, completes and clears items", () => {
		let items: TodoItem[] = [];

		let result = applyTodoCommand(items, "write tests");
		expect(result.action).toBe("add");
		items = result.items;
		result = applyTodoCommand(items, "  ship it  ");
		items = result.items;
		expect(items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		result = applyTodoCommand(items, "");
		expect(result.action).toBe("list");
		expect(result.items).toEqual(items);

		result = applyTodoCommand(items, "done 2");
		expect(result.error).toBeUndefined();
		expect(result.items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: true },
		]);
		// input is not mutated
		expect(items[1]?.done).toBe(false);

		result = applyTodoCommand(result.items, "clear");
		expect(result.action).toBe("clear");
		expect(result.items).toEqual([]);
	});

	it("reports an error for an unknown item number", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		for (const arg of ["done 0", "done 2", "done x", "done 1.5"]) {
			const result = applyTodoCommand(items, arg);
			expect(result.error).toBe(`No todo item ${arg.slice("done ".length)}`);
			expect(result.items).toEqual(items);
		}
	});

	it("is registered as a builtin slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
