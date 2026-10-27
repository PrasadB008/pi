import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("adds trimmed items and returns 1-based numbers", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests  ")).toBe(1);
		expect(todos.add("ship it")).toBe(2);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("ignores blank text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.list()).toEqual([]);
	});

	it("clears items", () => {
		const todos = new TodoList();
		todos.add("one");
		todos.clear();
		expect(todos.list()).toEqual([]);
	});

	it("formats a numbered list", () => {
		expect(formatTodoList(["a", "b"])).toBe("1. a\n2. b");
	});
});

describe("/todo registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
