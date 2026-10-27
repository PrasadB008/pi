import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("adds trimmed items with 1-based numbers and ignores empty text", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe(1);
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.add("ship it")).toBe(2);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
		expect(formatTodoList(todos.list())).toBe("1. write tests\n2. ship it");
	});

	it("clears items and formats an empty list as undefined", () => {
		const todos = new TodoList();
		todos.add("x");
		todos.clear();
		expect(formatTodoList(todos.list())).toBeUndefined();
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
