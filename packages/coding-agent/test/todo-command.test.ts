import { describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { runTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("/todo command", () => {
	test("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	test("reports an empty list when no todos exist", () => {
		const result = runTodoCommand(new TodoList(), "/todo");
		expect(result.kind).toBe("empty");
		expect(result.message).toContain("No todos");
	});

	test("adds items with /todo <text> and lists them with /todo", () => {
		const todoList = new TodoList();
		expect(runTodoCommand(todoList, "/todo write tests")).toEqual({
			kind: "added",
			message: "Todo 1 added: write tests",
		});
		expect(runTodoCommand(todoList, "/todo   update docs  ").message).toBe("Todo 2 added: update docs");
		expect(todoList.list()).toEqual(["write tests", "update docs"]);

		const listed = runTodoCommand(todoList, "/todo");
		expect(listed.kind).toBe("list");
		expect(listed.message).toBe("1. write tests\n2. update docs");
	});

	test("keeps separate lists independent and clear empties the list", () => {
		const first = new TodoList();
		const second = new TodoList();
		runTodoCommand(first, "/todo a");
		expect(second.list()).toEqual([]);
		first.clear();
		expect(runTodoCommand(first, "/todo").kind).toBe("empty");
	});
});
