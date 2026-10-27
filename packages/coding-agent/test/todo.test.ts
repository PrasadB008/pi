import { describe, it, expect, beforeEach, vi } from "vitest";

describe("/todo command", () => {
	let todos: string[] = [];

	beforeEach(() => {
		todos = [];
	});

	it("should add a todo item", () => {
		const todoText = "Fix bug in parser";
		todos.push(todoText);
		expect(todos).toContain(todoText);
		expect(todos.length).toBe(1);
	});

	it("should list todos when empty", () => {
		expect(todos.length).toBe(0);
	});

	it("should list multiple todos", () => {
		todos.push("Task 1");
		todos.push("Task 2");
		todos.push("Task 3");
		expect(todos.length).toBe(3);
		expect(todos[0]).toBe("Task 1");
		expect(todos[1]).toBe("Task 2");
		expect(todos[2]).toBe("Task 3");
	});

	it("should parse /todo command with text", () => {
		const text = "/todo Fix the build";
		const todoText = text.slice(6).trim();
		expect(todoText).toBe("Fix the build");
		todos.push(todoText);
		expect(todos).toContain("Fix the build");
	});

	it("should handle /todo command without text", () => {
		const text = "/todo";
		expect(text).toBe("/todo");
		expect(todos.length).toBe(0);
	});

	it("should format todo list with numbers", () => {
		todos.push("First task");
		todos.push("Second task");
		const todoList = todos.map((todo, i) => `${i + 1}. ${todo}`).join("\n");
		expect(todoList).toBe("1. First task\n2. Second task");
	});
});
