import { describe, expect, it } from "vitest";
import { TodoList } from "../src/modes/interactive/todo.ts";

describe("TodoList", () => {
	it("should add items to the list", () => {
		const todoList = new TodoList();
		todoList.add("Buy groceries");
		todoList.add("Write tests");

		const items = todoList.list();
		expect(items).toEqual(["Buy groceries", "Write tests"]);
	});

	it("should format empty list", () => {
		const todoList = new TodoList();
		expect(todoList.format()).toBe("No todos yet.");
	});

	it("should format list with items", () => {
		const todoList = new TodoList();
		todoList.add("First task");
		todoList.add("Second task");

		const formatted = todoList.format();
		expect(formatted).toBe("1. First task\n2. Second task");
	});

	it("should maintain order of items", () => {
		const todoList = new TodoList();
		todoList.add("Task 1");
		todoList.add("Task 2");
		todoList.add("Task 3");

		const items = todoList.list();
		expect(items[0]).toBe("Task 1");
		expect(items[1]).toBe("Task 2");
		expect(items[2]).toBe("Task 3");
	});
});
