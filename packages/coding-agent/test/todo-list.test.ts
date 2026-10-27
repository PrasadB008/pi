import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, parseTodoArgument, TodoList } from "../src/core/todo-list.ts";

describe("todo list", () => {
	it("adds trimmed items in order and ignores blank text", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests  ")).toBe(1);
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.add("ship it")).toBe(2);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("formats a numbered list", () => {
		expect(formatTodoList(["a", "b"])).toBe("1. a\n2. b");
	});

	it("parses the /todo argument", () => {
		expect(parseTodoArgument("/todo")).toBe("");
		expect(parseTodoArgument("/todo   buy milk ")).toBe("buy milk");
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
