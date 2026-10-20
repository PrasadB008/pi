import { describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, runTodoCommand, type TodoItem } from "../src/core/todo.ts";

describe("/todo", () => {
	test("is registered as a builtin slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	test("lists an empty todo list by default", () => {
		const items: TodoItem[] = [];
		expect(runTodoCommand(items, "").message).toContain("No todos");
	});

	test("add, done, undo, rm and clear", () => {
		const items: TodoItem[] = [];
		runTodoCommand(items, " add write tests ");
		runTodoCommand(items, "add ship it");
		expect(items).toEqual([
			{ text: "write tests", done: false },
			{ text: "ship it", done: false },
		]);

		expect(runTodoCommand(items, "done 1").message).toBe("1. [x] write tests\n2. [ ] ship it");
		expect(runTodoCommand(items, "undo 1").message).toBe(formatTodoList(items));
		expect(items[0].done).toBe(false);

		runTodoCommand(items, "done 2");
		expect(runTodoCommand(items, "clear").message).toBe("Cleared 1 completed todo(s)");
		expect(items).toEqual([{ text: "write tests", done: false }]);

		expect(runTodoCommand(items, "rm 1").message).toBe("Removed todo: write tests");
		expect(items).toEqual([]);
	});

	test("reports errors for bad input", () => {
		const items: TodoItem[] = [{ text: "a", done: false }];
		expect(runTodoCommand(items, "add").error).toContain("Usage");
		expect(runTodoCommand(items, "done 5").error).toContain("Usage");
		expect(runTodoCommand(items, "done x").error).toContain("Usage");
		expect(runTodoCommand(items, "bogus").error).toContain("Usage");
		expect(items).toEqual([{ text: "a", done: false }]);
	});
});
