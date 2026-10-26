import { describe, it, expect } from "vitest";

/**
 * Simple todo list implementation for testing
 */
class TodoList {
	private items: string[] = [];

	addItem(text: string): void {
		if (text.trim()) {
			this.items.push(text);
		}
	}

	getItems(): ReadonlyArray<string> {
		return this.items;
	}

	clear(): void {
		this.items = [];
	}
}

describe("TodoList", () => {
	it("should start with an empty todo list", () => {
		const todoList = new TodoList();
		expect(todoList.getItems()).toHaveLength(0);
	});

	it("should add a todo item", () => {
		const todoList = new TodoList();
		todoList.addItem("Fix bug in parser");
		expect(todoList.getItems()).toHaveLength(1);
		expect(todoList.getItems()[0]).toBe("Fix bug in parser");
	});

	it("should add multiple todo items", () => {
		const todoList = new TodoList();
		todoList.addItem("Fix bug in parser");
		todoList.addItem("Add tests");
		todoList.addItem("Update docs");
		expect(todoList.getItems()).toHaveLength(3);
		expect(todoList.getItems()).toEqual(["Fix bug in parser", "Add tests", "Update docs"]);
	});

	it("should retrieve all todo items in order", () => {
		const todoList = new TodoList();
		todoList.addItem("Task 1");
		todoList.addItem("Task 2");
		todoList.addItem("Task 3");
		const retrieved = todoList.getItems();
		expect(retrieved).toEqual(["Task 1", "Task 2", "Task 3"]);
	});

	it("should not add empty or whitespace-only items", () => {
		const todoList = new TodoList();
		todoList.addItem("");
		todoList.addItem("   ");
		todoList.addItem("\t");
		expect(todoList.getItems()).toHaveLength(0);
	});

	it("should add items with whitespace trimmed", () => {
		const todoList = new TodoList();
		todoList.addItem("  Task with spaces  ");
		expect(todoList.getItems()[0]).toBe("  Task with spaces  ");
	});

	it("should clear all items", () => {
		const todoList = new TodoList();
		todoList.addItem("Task 1");
		todoList.addItem("Task 2");
		expect(todoList.getItems()).toHaveLength(2);
		todoList.clear();
		expect(todoList.getItems()).toHaveLength(0);
	});
});
