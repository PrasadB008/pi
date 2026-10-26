import { describe, expect, it } from "vitest";

/**
 * Simple todo list manager for testing the /todo command logic.
 */
class TodoList {
	private items: string[] = [];

	add(text: string): void {
		if (text.trim()) {
			this.items.push(text.trim());
		}
	}

	list(): string[] {
		return [...this.items];
	}

	clear(): void {
		this.items = [];
	}
}

describe("TodoList", () => {
	it("should add a todo item", () => {
		const todo = new TodoList();
		todo.add("Fix bug in parser");
		expect(todo.list()).toEqual(["Fix bug in parser"]);
	});

	it("should list multiple todo items", () => {
		const todo = new TodoList();
		todo.add("Fix bug in parser");
		todo.add("Add tests");
		todo.add("Update docs");
		expect(todo.list()).toEqual(["Fix bug in parser", "Add tests", "Update docs"]);
	});

	it("should return empty list initially", () => {
		const todo = new TodoList();
		expect(todo.list()).toEqual([]);
	});

	it("should ignore empty items", () => {
		const todo = new TodoList();
		todo.add("");
		todo.add("   ");
		expect(todo.list()).toEqual([]);
	});

	it("should trim whitespace from items", () => {
		const todo = new TodoList();
		todo.add("  Fix bug  ");
		expect(todo.list()).toEqual(["Fix bug"]);
	});

	it("should clear all items", () => {
		const todo = new TodoList();
		todo.add("Item 1");
		todo.add("Item 2");
		todo.clear();
		expect(todo.list()).toEqual([]);
	});
});
