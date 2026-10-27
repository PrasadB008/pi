import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { parseTodoArgs, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("starts empty", () => {
		expect(new TodoList().list()).toEqual([]);
	});

	it("adds trimmed items and returns 1-based numbers", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe(1);
		expect(todos.add("ship it")).toBe(2);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("ignores blank text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.list()).toEqual([]);
	});
});

describe("parseTodoArgs", () => {
	it("returns empty string for bare /todo", () => {
		expect(parseTodoArgs("/todo")).toBe("");
	});

	it("returns the trimmed text after /todo", () => {
		expect(parseTodoArgs("/todo   buy milk  ")).toBe("buy milk");
	});
});

describe("/todo registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
