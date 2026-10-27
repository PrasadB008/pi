import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, parseTodoArgs, TodoList } from "../src/core/todo-list.ts";

describe("todo list", () => {
	it("adds and lists items in order", () => {
		const todos = new TodoList();
		todos.add("write tests");
		todos.add("update docs");
		expect(todos.list()).toEqual(["write tests", "update docs"]);
		todos.clear();
		expect(todos.list()).toEqual([]);
	});

	it("parses the text after /todo", () => {
		expect(parseTodoArgs("/todo")).toBe("");
		expect(parseTodoArgs("/todo   buy milk  ")).toBe("buy milk");
	});

	it("formats numbered items and the empty state", () => {
		expect(formatTodoList(["a", "b"])).toBe("1. a\n2. b");
		expect(formatTodoList([])).toContain("No todos");
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
