import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { parseTodoArgument, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("adds items and lists them in order", () => {
		const todos = new TodoList();
		expect(todos.list()).toEqual([]);
		expect(todos.add("  write tests ")).toBe("write tests");
		todos.add("ship it");
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("ignores empty text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.list()).toEqual([]);
	});

	it("returns a copy of the items", () => {
		const todos = new TodoList();
		todos.add("a");
		todos.list().push("b");
		expect(todos.list()).toEqual(["a"]);
	});
});

describe("/todo", () => {
	it("parses the argument from the input line", () => {
		expect(parseTodoArgument("/todo")).toBe("");
		expect(parseTodoArgument("/todo   buy milk ")).toBe("buy milk");
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
