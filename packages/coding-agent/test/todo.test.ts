import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { applyTodoCommand, TODO_USAGE, type TodoItem } from "../src/core/todo.ts";

function run(items: TodoItem[], args: string): TodoItem[] {
	const result = applyTodoCommand(items, args);
	if (!result.ok) {
		throw new Error(result.message);
	}
	return result.items;
}

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("adds, completes and clears items", () => {
		let items = run([], "");
		expect(items).toEqual([]);

		items = run(items, " add write tests ");
		items = run(items, "add ship it");
		expect(items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		items = run(items, "done 2");
		expect(items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: true },
		]);

		expect(run(items, "clear")).toEqual([]);
	});

	it("does not mutate the input list", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		run(items, "done 1");
		run(items, "add b");
		expect(items).toEqual([{ text: "a", done: false }]);
	});

	it("rejects invalid input with a message", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		expect(applyTodoCommand(items, "add")).toEqual({ ok: false, message: TODO_USAGE });
		expect(applyTodoCommand(items, "bogus")).toEqual({ ok: false, message: TODO_USAGE });
		for (const args of ["done", "done 0", "done 2", "done x", "done 1x"]) {
			const result = applyTodoCommand(items, args);
			expect(result.ok).toBe(false);
		}
	});
});
