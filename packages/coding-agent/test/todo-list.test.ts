import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { getTodoArgument, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("starts empty", () => {
		expect(new TodoList().list()).toEqual([]);
	});

	it("adds trimmed items in order", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe(true);
		expect(todos.add("ship it")).toBe(true);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("rejects empty text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBe(false);
		expect(todos.list()).toEqual([]);
	});

	it("keeps separate lists per instance", () => {
		const a = new TodoList();
		const b = new TodoList();
		a.add("only in a");
		expect(b.list()).toEqual([]);
	});
});

describe("getTodoArgument", () => {
	it("returns an empty string for bare /todo", () => {
		expect(getTodoArgument("/todo")).toBe("");
	});

	it("returns the trimmed text after /todo", () => {
		expect(getTodoArgument("/todo   buy milk ")).toBe("buy milk");
	});
});

describe("/todo registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
