import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TODO_USAGE, TodoList } from "../src/core/todo.ts";

describe("TodoList", () => {
	it("is registered as a builtin slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todo")).toBe(true);
	});

	it("shows a hint when empty", () => {
		const todos = new TodoList();
		const result = todos.execute("");
		expect(result.isError).toBe(false);
		expect(result.lines[0]).toContain("No todos");
	});

	it("adds and lists items", () => {
		const todos = new TodoList();
		expect(todos.execute("write tests").lines).toEqual(["Added todo 1: write tests"]);
		todos.execute("ship it");
		expect(todos.execute("").lines).toEqual(["1. [ ] write tests", "2. [ ] ship it"]);
	});

	it("marks items done, undone and removes them", () => {
		const todos = new TodoList();
		todos.execute("a");
		todos.execute("b");
		todos.execute("done 1");
		expect(todos.execute("").lines).toEqual(["1. [x] a", "2. [ ] b"]);
		todos.execute("undo 1");
		expect(todos.getItems()[0].done).toBe(false);
		todos.execute("remove 1");
		expect(todos.execute("").lines).toEqual(["1. [ ] b"]);
	});

	it("clears all items", () => {
		const todos = new TodoList();
		todos.execute("a");
		expect(todos.execute("clear").lines).toEqual(["Cleared 1 todo"]);
		expect(todos.getItems()).toHaveLength(0);
	});

	it("reports invalid input", () => {
		const todos = new TodoList();
		expect(todos.execute("done").lines).toEqual([TODO_USAGE]);
		expect(todos.execute("done x").isError).toBe(true);
		expect(todos.execute("done 3")).toEqual({ lines: ["No todo 3"], isError: true });
	});
});
