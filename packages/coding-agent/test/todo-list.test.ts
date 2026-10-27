import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("lists a hint when empty", () => {
		expect(new TodoList().format()).toBe("No todos. Add one with /todo <text>");
	});

	it("adds items and lists them numbered in order", () => {
		const todos = new TodoList();
		todos.add("write tests");
		todos.add("open PR");
		expect(todos.items).toEqual(["write tests", "open PR"]);
		expect(todos.format()).toBe("Todos:\n1. write tests\n2. open PR");
	});
});
