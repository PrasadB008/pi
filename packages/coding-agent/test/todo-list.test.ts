import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("reports an empty list", () => {
		const todos = new TodoList();
		expect(todos.handleCommand("/todo").message).toContain("No todo items");
	});

	it("adds items and lists them in order", () => {
		const todos = new TodoList();
		expect(todos.handleCommand("/todo write tests").message).toBe("Todo added (1): write tests");
		expect(todos.handleCommand("/todo   update docs  ").message).toBe("Todo added (2): update docs");
		expect(todos.getItems()).toEqual(["write tests", "update docs"]);
		expect(todos.handleCommand("/todo").message).toBe("Todo:\n1. write tests\n2. update docs");
	});
});
