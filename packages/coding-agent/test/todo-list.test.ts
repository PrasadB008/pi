import { describe, expect, it } from "vitest";
import { TODO_USAGE, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("shows a hint when empty", () => {
		const result = new TodoList().run("");
		expect(result.isError).toBe(false);
		expect(result.message).toContain("No todo items");
	});

	it("adds, completes, reopens and lists items", () => {
		const todo = new TodoList();
		todo.run("add write tests");
		todo.run("add ship it");
		todo.run("done 1");
		expect(todo.run("").message).toBe("1. [x] write tests\n2. [ ] ship it");
		todo.run("undo 1");
		expect(todo.getItems()[0].done).toBe(false);
	});

	it("removes items and clears the list", () => {
		const todo = new TodoList();
		todo.run("add a");
		todo.run("add b");
		todo.run("rm 1");
		expect(todo.getItems().map((i) => i.text)).toEqual(["b"]);
		todo.run("clear");
		expect(todo.getItems()).toHaveLength(0);
	});

	it("reports errors for bad input", () => {
		const todo = new TodoList();
		expect(todo.run("add").isError).toBe(true);
		expect(todo.run("done 3").isError).toBe(true);
		expect(todo.run("bogus")).toEqual({ message: TODO_USAGE, isError: true });
	});
});
