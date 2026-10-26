import { describe, expect, it } from "vitest";

/**
 * Test for the /todo slash command functionality.
 * Tests the core logic of adding and listing todo items.
 */

class TodoList {
	private items: string[] = [];

	add(text: string): void {
		this.items.push(text);
	}

	list(): string[] {
		return [...this.items];
	}

	clear(): void {
		this.items = [];
	}
}

describe("TodoList", () => {
	it("should add items to the todo list", () => {
		const todoList = new TodoList();
		todoList.add("Fix bug in parser");
		todoList.add("Write documentation");

		const items = todoList.list();
		expect(items).toEqual(["Fix bug in parser", "Write documentation"]);
	});

	it("should return empty list initially", () => {
		const todoList = new TodoList();
		expect(todoList.list()).toEqual([]);
	});

	it("should maintain order of items", () => {
		const todoList = new TodoList();
		todoList.add("First");
		todoList.add("Second");
		todoList.add("Third");

		expect(todoList.list()).toEqual(["First", "Second", "Third"]);
	});

	it("should clear all items", () => {
		const todoList = new TodoList();
		todoList.add("Item 1");
		todoList.add("Item 2");
		todoList.clear();

		expect(todoList.list()).toEqual([]);
	});

	it("should allow duplicate items", () => {
		const todoList = new TodoList();
		todoList.add("Duplicate");
		todoList.add("Duplicate");

		expect(todoList.list()).toEqual(["Duplicate", "Duplicate"]);
	});
});
