import { describe, expect, test } from "vitest";
import { TodoManager } from "../src/utils/todo-manager.ts";

describe("TodoManager", () => {
	test("adds todos and retrieves them", () => {
		const manager = new TodoManager();
		manager.addTodo("Fix bug in parser");
		manager.addTodo("Write documentation");

		const todos = manager.getTodos();
		expect(todos).toEqual(["Fix bug in parser", "Write documentation"]);
	});

	test("formats empty todo list", () => {
		const manager = new TodoManager();
		expect(manager.formatTodos()).toBe("No todos yet. Use /todo <text> to add one.");
	});

	test("formats todos with numbers", () => {
		const manager = new TodoManager();
		manager.addTodo("First task");
		manager.addTodo("Second task");

		expect(manager.formatTodos()).toBe("1. First task\n2. Second task");
	});

	test("clears all todos", () => {
		const manager = new TodoManager();
		manager.addTodo("Task 1");
		manager.addTodo("Task 2");

		manager.clear();
		expect(manager.getTodos()).toEqual([]);
		expect(manager.formatTodos()).toBe("No todos yet. Use /todo <text> to add one.");
	});
});
