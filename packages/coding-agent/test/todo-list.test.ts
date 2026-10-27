import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { parseTodoArgument, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("adds trimmed items in order and ignores empty text", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests  ")).toBe("write tests");
		expect(todos.add("   ")).toBeUndefined();
		todos.add("ship it");
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("parses the /todo argument", () => {
		expect(parseTodoArgument("/todo")).toBe("");
		expect(parseTodoArgument("/todo   buy milk ")).toBe("buy milk");
	});

	it("registers /todo as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
