import { describe, expect, it } from "vitest";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("should add items to the list", () => {
		const todoList = new TodoList();
		todoList.add("First task");
		todoList.add("Second task");

		const items = todoList.getItems();
		expect(items).toEqual(["First task", "Second task"]);
	});

	it("should format empty list", () => {
		const todoList = new TodoList();
		expect(todoList.format()).toBe("Todo list is empty.");
	});

	it("should format items with numbers", () => {
		const todoList = new TodoList();
		todoList.add("First task");
		todoList.add("Second task");

		const formatted = todoList.format();
		expect(formatted).toBe("1. First task\n2. Second task");
	});

	it("should clear all items", () => {
		const todoList = new TodoList();
		todoList.add("Task 1");
		todoList.add("Task 2");

		todoList.clear();
		expect(todoList.getItems()).toEqual([]);
		expect(todoList.format()).toBe("Todo list is empty.");
	});

	it("should handle multiple operations", () => {
		const todoList = new TodoList();

		// Add items
		todoList.add("Buy groceries");
		todoList.add("Write tests");
		expect(todoList.getItems().length).toBe(2);

		// Format and verify
		const formatted = todoList.format();
		expect(formatted).toContain("1. Buy groceries");
		expect(formatted).toContain("2. Write tests");

		// Clear and verify
		todoList.clear();
		expect(todoList.getItems().length).toBe(0);
	});
});
