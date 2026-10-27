import { describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("todo list", () => {
	test("adds trimmed items and ignores empty text", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests  ")).toBe("write tests");
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.list()).toEqual(["write tests"]);
	});

	test("parseTodoCommand returns text to add or undefined for listing", () => {
		expect(parseTodoCommand("/todo")).toBeUndefined();
		expect(parseTodoCommand("/todo   ")).toBeUndefined();
		expect(parseTodoCommand("/todo fix the bug")).toBe("fix the bug");
	});

	test("formatTodoList numbers items and handles empty list", () => {
		expect(formatTodoList([])).toContain("No todo items");
		expect(formatTodoList(["a", "b"])).toBe("1. a\n2. b");
	});

	test("/todo is a registered built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
