import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { applyTodoCommand, formatTodoList, type TodoItem } from "../src/core/todo-list.ts";

function expectOk(items: readonly TodoItem[], args: string): { items: TodoItem[]; notice?: string } {
	const result = applyTodoCommand(items, args);
	if (!result.ok) throw new Error(`expected ok, got error: ${result.error}`);
	return result;
}

describe("/todo", () => {
	it("is registered as a builtin slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("supports add, list, done, rm and clear", () => {
		let items: TodoItem[] = [];

		items = expectOk(items, "write tests").items;
		items = expectOk(items, "  ship it  ").items;
		expect(formatTodoList(items)).toEqual(["1. [ ] write tests", "2. [ ] ship it"]);

		expect(expectOk(items, "").items).toEqual(items);

		items = expectOk(items, "done 1").items;
		expect(formatTodoList(items)).toEqual(["1. [x] write tests", "2. [ ] ship it"]);

		items = expectOk(items, "rm 1").items;
		expect(formatTodoList(items)).toEqual(["1. [ ] ship it"]);

		const cleared = expectOk(items, "clear");
		expect(cleared.items).toEqual([]);
		expect(cleared.notice).toBe("Todo list cleared");
	});

	it("does not mutate the input list", () => {
		const original: TodoItem[] = [{ text: "a", done: false }];
		applyTodoCommand(original, "done 1");
		applyTodoCommand(original, "rm 1");
		applyTodoCommand(original, "b");
		expect(original).toEqual([{ text: "a", done: false }]);
	});

	it("rejects missing or out-of-range indexes", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		for (const args of ["done", "done 0", "done 2", "rm x", "rm -1", "rm 1.5"]) {
			const result = applyTodoCommand(items, args);
			expect(result.ok).toBe(false);
		}
	});

	it("adds text that merely starts with done or rm", () => {
		const items = expectOk([], "donut shop").items;
		expect(items).toEqual([{ text: "donut shop", done: false }]);
	});
});
