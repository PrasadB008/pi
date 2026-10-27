import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { parseTodoCommand, TodoList } from "../src/modes/interactive/todo-list.ts";

describe("todo list", () => {
	it("adds trimmed items in order and ignores empty text", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe("write tests");
		expect(todos.add("   ")).toBeUndefined();
		todos.add("ship it");
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("parses /todo commands", () => {
		expect(parseTodoCommand("/todo")).toBe("");
		expect(parseTodoCommand("/todo  buy milk ")).toBe("buy milk");
		expect(parseTodoCommand("/todos")).toBeUndefined();
		expect(parseTodoCommand("/name x")).toBeUndefined();
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
