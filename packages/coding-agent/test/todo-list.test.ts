import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, parseTodoArgument, TodoList } from "../src/core/todo-list.ts";

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("parses the argument, or undefined when used alone", () => {
		expect(parseTodoArgument("/todo")).toBeUndefined();
		expect(parseTodoArgument("/todo   ")).toBeUndefined();
		expect(parseTodoArgument("/todo write tests")).toBe("write tests");
	});

	it("starts empty, then lists added items in order", () => {
		const todos = new TodoList();
		expect(todos.list()).toEqual([]);
		todos.add("first");
		todos.add("second");
		expect(formatTodoList(todos.list())).toBe("1. first\n2. second");
	});
});
