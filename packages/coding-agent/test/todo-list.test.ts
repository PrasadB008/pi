import { describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	test("adds trimmed items in order", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe(true);
		expect(todos.add("ship it")).toBe(true);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	test("ignores blank text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBe(false);
		expect(todos.list()).toEqual([]);
	});

	test("/todo is a registered built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
