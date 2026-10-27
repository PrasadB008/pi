import { describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("/todo", () => {
	test("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	test("parses the text after /todo", () => {
		expect(parseTodoCommand("/todo")).toBe("");
		expect(parseTodoCommand("/todo   buy milk ")).toBe("buy milk");
	});

	test("adds items in order and lists them", () => {
		const todos = new TodoList();
		expect(todos.list()).toEqual([]);
		expect(todos.add("first")).toBe(1);
		expect(todos.add("second")).toBe(2);
		expect(todos.list()).toEqual(["first", "second"]);
	});
});
