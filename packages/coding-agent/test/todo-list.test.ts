import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("todo list", () => {
	it("adds items and lists them in order", () => {
		const todos = new TodoList();
		expect(todos.add("write tests")).toBe(1);
		expect(todos.add("ship it")).toBe(2);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("parses the text after /todo", () => {
		expect(parseTodoCommand("/todo")).toBeUndefined();
		expect(parseTodoCommand("/todo   ")).toBeUndefined();
		expect(parseTodoCommand("/todo  buy milk ")).toBe("buy milk");
	});

	it("formats items as a numbered list", () => {
		expect(formatTodoList(["a", "b"])).toBe("1. a\n2. b");
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
