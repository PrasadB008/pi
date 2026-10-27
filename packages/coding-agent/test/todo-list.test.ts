import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("parseTodoCommand", () => {
	it("returns undefined for other input", () => {
		expect(parseTodoCommand("/session")).toBeUndefined();
		expect(parseTodoCommand("/todos")).toBeUndefined();
		expect(parseTodoCommand("todo")).toBeUndefined();
	});

	it("returns an empty string for a bare /todo", () => {
		expect(parseTodoCommand("/todo")).toBe("");
	});

	it("returns the trimmed text after /todo", () => {
		expect(parseTodoCommand("/todo  write tests ")).toBe("write tests");
	});
});

describe("TodoList", () => {
	it("adds trimmed items in order and ignores empty text", () => {
		const todos = new TodoList();
		expect(todos.add("  first ")).toBe(true);
		expect(todos.add("second")).toBe(true);
		expect(todos.add("   ")).toBe(false);
		expect(todos.list()).toEqual(["first", "second"]);
	});
});

describe("/todo registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
