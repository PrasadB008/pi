import { describe, it, expect } from "vitest";

/**
 * Simple todo list manager for testing the /todo command logic
 */
class TodoList {
	private todos: string[] = [];

	add(text: string): void {
		this.todos.push(text);
	}

	list(): string[] {
		return [...this.todos];
	}

	clear(): void {
		this.todos = [];
	}
}

describe("TodoList", () => {
	it("should add a todo item", () => {
		const todoList = new TodoList();
		todoList.add("Fix bug in parser");
		expect(todoList.list()).toEqual(["Fix bug in parser"]);
	});

	it("should add multiple todo items", () => {
		const todoList = new TodoList();
		todoList.add("Fix bug in parser");
		todoList.add("Add tests");
		todoList.add("Update docs");
		expect(todoList.list()).toEqual(["Fix bug in parser", "Add tests", "Update docs"]);
	});

	it("should return empty list initially", () => {
		const todoList = new TodoList();
		expect(todoList.list()).toEqual([]);
	});

	it("should clear all todos", () => {
		const todoList = new TodoList();
		todoList.add("Task 1");
		todoList.add("Task 2");
		todoList.clear();
		expect(todoList.list()).toEqual([]);
	});

	it("should preserve order of todos", () => {
		const todoList = new TodoList();
		const tasks = ["First", "Second", "Third", "Fourth"];
		tasks.forEach((task) => todoList.add(task));
		expect(todoList.list()).toEqual(tasks);
	});
});
