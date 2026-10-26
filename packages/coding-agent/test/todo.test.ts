import { describe, it, expect } from "vitest";
import { TodoList } from "../src/core/todo.ts";

describe("TodoList", () => {
	it("should add and list todos", () => {
		const todoList = new TodoList();
		expect(todoList.format()).toBe("No todos yet.");

		todoList.add("First task");
		todoList.add("Second task");

		const items = todoList.list();
		expect(items).toEqual(["First task", "Second task"]);
	});

	it("should format todos with numbers", () => {
		const todoList = new TodoList();
		todoList.add("Buy groceries");
		todoList.add("Write tests");
		todoList.add("Deploy app");

		const formatted = todoList.format();
		expect(formatted).toBe("1. Buy groceries\n2. Write tests\n3. Deploy app");
	});

	it("should show empty message when no todos", () => {
		const todoList = new TodoList();
		expect(todoList.format()).toBe("No todos yet.");
		expect(todoList.list()).toEqual([]);
	});
});
