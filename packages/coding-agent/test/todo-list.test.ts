import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { runTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("/todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("lists nothing when empty", () => {
		expect(runTodoCommand(new TodoList(), "/todo")).toBe("No todo items. Add one with /todo <text>");
	});

	it("adds items and lists them in order", () => {
		const list = new TodoList();
		expect(runTodoCommand(list, "/todo write tests")).toBe("Added todo #1: write tests");
		expect(runTodoCommand(list, "/todo  ship it ")).toBe("Added todo #2: ship it");
		expect(runTodoCommand(list, "/todo")).toBe("Todo:\n1. write tests\n2. ship it");
	});
});
