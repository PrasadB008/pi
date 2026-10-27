import { describe, expect, it } from "vitest";

/**
 * Simple todo list implementation for testing.
 * This mirrors the logic in AgentSession.
 */
class TodoList {
	private items: string[] = [];

	addItem(item: string): void {
		this.items.push(item);
	}

	getItems(): string[] {
		return [...this.items];
	}

	clearItems(): void {
		this.items = [];
	}
}

describe("Todo list management", () => {
	it("should start with an empty list", () => {
		const todoList = new TodoList();
		expect(todoList.getItems()).toEqual([]);
	});

	it("should add a single todo item", () => {
		const todoList = new TodoList();
		todoList.addItem("Fix bug in parser");
		expect(todoList.getItems()).toEqual(["Fix bug in parser"]);
	});

	it("should add multiple todo items in order", () => {
		const todoList = new TodoList();
		todoList.addItem("Fix bug in parser");
		todoList.addItem("Add tests");
		todoList.addItem("Update docs");
		expect(todoList.getItems()).toEqual(["Fix bug in parser", "Add tests", "Update docs"]);
	});

	it("should clear all todo items", () => {
		const todoList = new TodoList();
		todoList.addItem("Fix bug in parser");
		todoList.addItem("Add tests");
		todoList.clearItems();
		expect(todoList.getItems()).toEqual([]);
	});

	it("should return a copy of the todo list to prevent external mutation", () => {
		const todoList = new TodoList();
		todoList.addItem("Fix bug in parser");
		const items = todoList.getItems();
		items.push("Malicious item");
		expect(todoList.getItems()).toEqual(["Fix bug in parser"]);
	});
});
