import { describe, expect, it } from "vitest";
import { runTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("runTodoCommand", () => {
	it("reports an empty list when /todo is used alone", () => {
		const todos = new TodoList();
		expect(runTodoCommand(todos, "/todo")).toBe("No todos. Use /todo <text> to add one.");
	});

	it("adds items with /todo <text> and lists them in order", () => {
		const todos = new TodoList();
		expect(runTodoCommand(todos, "/todo write tests")).toBe("Todo added (1): write tests");
		expect(runTodoCommand(todos, "/todo   update docs  ")).toBe("Todo added (2): update docs");
		expect(runTodoCommand(todos, "/todo")).toBe("Todos:\n1. write tests\n2. update docs");
		expect(todos.list()).toEqual(["write tests", "update docs"]);
	});

	it("treats whitespace-only text as a list request", () => {
		const todos = new TodoList();
		runTodoCommand(todos, "/todo one");
		expect(runTodoCommand(todos, "/todo    ")).toBe("Todos:\n1. one");
	});

	it("keeps lists independent per instance", () => {
		const a = new TodoList();
		const b = new TodoList();
		runTodoCommand(a, "/todo only in a");
		expect(b.list()).toEqual([]);
	});
});
