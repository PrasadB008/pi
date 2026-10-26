import { describe, expect, it } from "vitest";

/**
 * Simple todo list manager for testing the /todo command logic.
 */
class TodoManager {
	private todos: string[] = [];

	addTodo(text: string): void {
		this.todos.push(text);
	}

	listTodos(): string[] {
		return [...this.todos];
	}

	clearTodos(): void {
		this.todos = [];
	}
}

describe("TodoManager", () => {
	it("adds a todo to the list", () => {
		const manager = new TodoManager();
		manager.addTodo("Fix bug in parser");
		expect(manager.listTodos()).toEqual(["Fix bug in parser"]);
	});

	it("adds multiple todos", () => {
		const manager = new TodoManager();
		manager.addTodo("Fix bug in parser");
		manager.addTodo("Write tests");
		manager.addTodo("Update documentation");
		expect(manager.listTodos()).toEqual([
			"Fix bug in parser",
			"Write tests",
			"Update documentation",
		]);
	});

	it("returns empty list when no todos", () => {
		const manager = new TodoManager();
		expect(manager.listTodos()).toEqual([]);
	});

	it("clears all todos", () => {
		const manager = new TodoManager();
		manager.addTodo("Task 1");
		manager.addTodo("Task 2");
		manager.clearTodos();
		expect(manager.listTodos()).toEqual([]);
	});

	it("preserves todo order", () => {
		const manager = new TodoManager();
		const todos = ["First", "Second", "Third", "Fourth"];
		for (const todo of todos) {
			manager.addTodo(todo);
		}
		expect(manager.listTodos()).toEqual(todos);
	});
});
