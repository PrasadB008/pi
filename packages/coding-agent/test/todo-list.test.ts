import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { runTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("reports an empty list", () => {
		expect(runTodoCommand(new TodoList(), "/todo")).toBe("No todo items. Usage: /todo <text>");
	});

	it("adds items and lists them in order", () => {
		const todos = new TodoList();
		expect(runTodoCommand(todos, "/todo write tests")).toBe("Todo added: write tests");
		expect(runTodoCommand(todos, "/todo   open PR  ")).toBe("Todo added: open PR");
		expect(todos.list()).toEqual(["write tests", "open PR"]);
		expect(runTodoCommand(todos, "/todo")).toBe("Todo:\n1. write tests\n2. open PR");
	});
});
