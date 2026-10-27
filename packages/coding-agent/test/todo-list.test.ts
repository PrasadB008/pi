import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("adds items in order and returns the new item count", () => {
		const todos = new TodoList();
		expect(todos.add("write tests")).toBe(1);
		expect(todos.add("update docs")).toBe(2);
		expect(todos.list()).toEqual(["write tests", "update docs"]);
	});

	it("formats items as a numbered list", () => {
		expect(formatTodoList(["write tests", "update docs"])).toBe("1. write tests\n2. update docs");
	});

	it("shows a usage hint when the list is empty", () => {
		expect(formatTodoList(new TodoList().list())).toContain("/todo <text>");
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
