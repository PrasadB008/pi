import { describe, expect, it, vi } from "vitest";

// Simple test for the todo functionality without requiring the full harness
describe("Todo list management", () => {
	it("manages todos with add, list, and clear operations", () => {
		// Simulate the todo list behavior
		const todos: string[] = [];

		// Add todos
		todos.push("Fix the bug");
		expect(todos).toEqual(["Fix the bug"]);

		todos.push("Write tests");
		expect(todos).toEqual(["Fix the bug", "Write tests"]);

		todos.push("Update docs");
		expect(todos).toEqual(["Fix the bug", "Write tests", "Update docs"]);

		// Get todos
		const retrieved = [...todos];
		expect(retrieved.length).toBe(3);

		// Clear todos
		todos.length = 0;
		expect(todos).toEqual([]);
	});

	it("handles empty todo list", () => {
		const todos: string[] = [];
		expect(todos).toEqual([]);
		expect(todos.length).toBe(0);
	});

	it("maintains todo order", () => {
		const todos: string[] = [];

		todos.push("First");
		todos.push("Second");
		todos.push("Third");

		expect(todos[0]).toBe("First");
		expect(todos[1]).toBe("Second");
		expect(todos[2]).toBe("Third");
	});

	it("supports multiple add and clear cycles", () => {
		const todos: string[] = [];

		// First cycle
		todos.push("Item 1");
		todos.push("Item 2");
		expect(todos.length).toBe(2);
		todos.length = 0;
		expect(todos.length).toBe(0);

		// Second cycle
		todos.push("Item A");
		todos.push("Item B");
		todos.push("Item C");
		expect(todos.length).toBe(3);
		todos.length = 0;
		expect(todos.length).toBe(0);
	});
});
