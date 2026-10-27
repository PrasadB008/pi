import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoItems, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("reports empty when /todo is used with no items", () => {
		expect(new TodoList().handleCommand("/todo")).toEqual({ kind: "empty" });
	});

	it("adds items and lists them in order", () => {
		const todos = new TodoList();
		expect(todos.handleCommand("/todo write tests")).toEqual({ kind: "added", count: 1, item: "write tests" });
		expect(todos.handleCommand("/todo   open PR  ")).toEqual({ kind: "added", count: 2, item: "open PR" });
		const result = todos.handleCommand("/todo");
		expect(result).toEqual({ kind: "list", items: ["write tests", "open PR"] });
		if (result.kind === "list") {
			expect(formatTodoItems(result.items)).toBe("1. write tests\n2. open PR");
		}
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
