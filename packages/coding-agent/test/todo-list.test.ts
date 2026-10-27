import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("parses text as an add and a bare command as a list", () => {
		expect(parseTodoCommand("/todo buy milk")).toEqual({ type: "add", text: "buy milk" });
		expect(parseTodoCommand("/todo   spaced   out  ")).toEqual({ type: "add", text: "spaced   out" });
		expect(parseTodoCommand("/todo")).toEqual({ type: "list" });
		expect(parseTodoCommand("/todo   ")).toEqual({ type: "list" });
	});

	it("adds items in order and lists them numbered", () => {
		const todos = new TodoList();
		expect(todos.add("write tests")).toBe(1);
		expect(todos.add("open PR")).toBe(2);
		expect(todos.list()).toEqual(["write tests", "open PR"]);
		expect(formatTodoList(todos.list())).toBe("Todos\n1. write tests\n2. open PR");
	});

	it("shows a hint when the list is empty", () => {
		expect(formatTodoList(new TodoList().list())).toContain("/todo <text>");
	});
});
