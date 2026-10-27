import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("adds trimmed items in order and lists them", () => {
		const todos = new TodoList();
		expect(todos.list()).toEqual([]);
		expect(todos.add("  write tests  ")).toBe("write tests");
		todos.add("ship it");
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("ignores empty items", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.list()).toEqual([]);
	});
});

describe("/todo command", () => {
	it("parses item text and treats bare /todo as a list request", () => {
		expect(parseTodoCommand("/todo")).toBe("");
		expect(parseTodoCommand("/todo   ")).toBe("");
		expect(parseTodoCommand("/todo buy milk")).toBe("buy milk");
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
