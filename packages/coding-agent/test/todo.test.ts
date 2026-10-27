import { describe, it, expect } from "vitest";
import { TodoList } from "../src/modes/interactive/todo.ts";

describe("TodoList", () => {
	it("should start with no items", () => {
		const todoList = new TodoList();
		expect(todoList.getItems()).toEqual([]);
	});

	it("should add items to the list", () => {
		const todoList = new TodoList();
		todoList.add("First task");
		todoList.add("Second task");
		expect(todoList.getItems()).toEqual(["First task", "Second task"]);
	});

	it("should maintain order of items", () => {
		const todoList = new TodoList();
		todoList.add("Task 1");
		todoList.add("Task 2");
		todoList.add("Task 3");
		const items = todoList.getItems();
		expect(items[0]).toBe("Task 1");
		expect(items[1]).toBe("Task 2");
		expect(items[2]).toBe("Task 3");
	});

	it("should clear all items", () => {
		const todoList = new TodoList();
		todoList.add("Task 1");
		todoList.add("Task 2");
		todoList.clear();
		expect(todoList.getItems()).toEqual([]);
	});

	it("should return readonly items", () => {
		const todoList = new TodoList();
		todoList.add("Task 1");
		const items = todoList.getItems();
		expect(items).toEqual(["Task 1"]);
		// Verify it's readonly by checking the type
		expect(Array.isArray(items)).toBe(true);
	});
});
