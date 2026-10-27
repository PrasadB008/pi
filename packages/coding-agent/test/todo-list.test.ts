import { describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	test("starts empty", () => {
		expect(new TodoList().list()).toEqual([]);
	});

	test("adds trimmed items in order and ignores empty text", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe("write tests");
		expect(todos.add("   ")).toBeUndefined();
		todos.add("ship it");
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});
});

describe("parseTodoCommand", () => {
	test("returns empty string for bare /todo", () => {
		expect(parseTodoCommand("/todo")).toBe("");
	});

	test("returns the argument text", () => {
		expect(parseTodoCommand("/todo  buy milk ")).toBe("buy milk");
	});
});

describe("/todo registration", () => {
	test("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
