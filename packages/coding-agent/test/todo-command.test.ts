import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("/todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("parses item text and treats bare /todo as list", () => {
		expect(parseTodoCommand("/todo  write tests ")).toBe("write tests");
		expect(parseTodoCommand("/todo")).toBe("");
	});

	it("adds, lists and clears items", () => {
		const todos = new TodoList();
		expect(formatTodoList(todos.list())).toBe("No todos yet. Add one with /todo <text>");
		expect(todos.add("first")).toBe(1);
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.add("second")).toBe(2);
		expect(formatTodoList(todos.list())).toBe("Todos:\n1. first\n2. second");
		todos.clear();
		expect(todos.list()).toEqual([]);
	});
});
