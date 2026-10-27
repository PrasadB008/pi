import { describe, expect, it } from "vitest";
import { formatTodoList, TodoList } from "../src/core/todo-list.ts";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";

describe("TodoList", () => {
	it("adds trimmed items in order and returns their 1-based position", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe(1);
		expect(todos.add("ship it")).toBe(2);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("ignores empty text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.list()).toEqual([]);
	});

	it("formats items as a numbered list", () => {
		expect(formatTodoList(["a", "b"])).toBe("1. a\n2. b");
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
