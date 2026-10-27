import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { parseTodoArgument, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("starts empty", () => {
		expect(new TodoList().list()).toEqual([]);
	});

	it("adds trimmed items in order and ignores blank text", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe(true);
		expect(todos.add("   ")).toBe(false);
		todos.add("ship it");
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("parses the /todo argument", () => {
		expect(parseTodoArgument("/todo")).toBe("");
		expect(parseTodoArgument("/todo   buy milk ")).toBe("buy milk");
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
