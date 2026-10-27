import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("adds trimmed items and lists them in order", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests  ")).toBe("write tests");
		todos.add("ship it");
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("ignores empty text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.list()).toEqual([]);
	});
});

describe("parseTodoCommand", () => {
	it("parses /todo forms", () => {
		expect(parseTodoCommand("/todo")).toBe("");
		expect(parseTodoCommand("/todo  buy milk ")).toBe("buy milk");
		expect(parseTodoCommand("/todos")).toBeUndefined();
		expect(parseTodoCommand("hello")).toBeUndefined();
	});
});

describe("builtin slash commands", () => {
	it("registers /todo", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
