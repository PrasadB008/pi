import { describe, expect, it } from "vitest";
import { TodoManager } from "../src/core/todo-manager.ts";

describe("TodoManager", () => {
	it("adds todos and lists them", () => {
		const manager = new TodoManager();

		manager.addTodo("Fix bug in parser");
		manager.addTodo("Write documentation");
		manager.addTodo("Review PR");

		expect(manager.getTodos()).toEqual(["Fix bug in parser", "Write documentation", "Review PR"]);
	});

	it("returns a copy of todos to prevent external mutation", () => {
		const manager = new TodoManager();
		manager.addTodo("First todo");

		const todos = manager.getTodos();
		todos.push("Mutated todo");

		expect(manager.getTodos()).toEqual(["First todo"]);
	});

	it("clears all todos", () => {
		const manager = new TodoManager();
		manager.addTodo("Todo 1");
		manager.addTodo("Todo 2");

		manager.clear();

		expect(manager.getTodos()).toEqual([]);
	});

	it("handles empty todo list", () => {
		const manager = new TodoManager();

		expect(manager.getTodos()).toEqual([]);
	});

	it("preserves todo order", () => {
		const manager = new TodoManager();
		const todos = ["First", "Second", "Third", "Fourth"];

		todos.forEach((todo) => manager.addTodo(todo));

		expect(manager.getTodos()).toEqual(todos);
	});
});
