import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("todo list", () => {
	it("adds trimmed items in order and ignores empty text", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe(true);
		expect(todos.add("   ")).toBe(false);
		expect(todos.add("ship it")).toBe(true);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("parses the argument of /todo", () => {
		expect(parseTodoCommand("/todo")).toBe("");
		expect(parseTodoCommand("/todo   buy milk ")).toBe("buy milk");
	});

	it("formats a numbered list or an empty hint", () => {
		expect(formatTodoList([])).toContain("/todo <text>");
		expect(formatTodoList(["a", "b"])).toBe("1. a\n2. b");
	});

	it("registers /todo as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
