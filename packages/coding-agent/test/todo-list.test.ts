import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("adds trimmed items and lists them in insertion order", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe(true);
		expect(todos.add("ship it")).toBe(true);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("ignores empty text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBe(false);
		expect(todos.list()).toEqual([]);
	});

	it("registers /todo as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
