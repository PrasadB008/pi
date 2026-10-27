import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("adds items and returns their 1-based number", () => {
		const todos = new TodoList();
		expect(todos.add("write tests")).toBe(1);
		expect(todos.add("  ship it  ")).toBe(2);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("ignores empty text and can be cleared", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBeUndefined();
		todos.add("one");
		todos.clear();
		expect(todos.list()).toEqual([]);
	});

	it("parses the argument of a /todo command line", () => {
		expect(parseTodoCommand("/todo")).toBe("");
		expect(parseTodoCommand("/todo buy milk ")).toBe("buy milk");
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
