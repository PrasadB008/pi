import { describe, it, expect } from "vitest";
import { TodoList } from "../src/modes/interactive/todo.ts";

describe("TodoList", () => {
	it("should add items and list them", () => {
		const todoList = new TodoList();
		todoList.add("First task");
		todoList.add("Second task");

		const items = todoList.list();
		expect(items).toEqual(["First task", "Second task"]);
	});

	it("should format items with numbers", () => {
		const todoList = new TodoList();
		todoList.add("Buy milk");
		todoList.add("Write tests");

		const formatted = todoList.format();
		expect(formatted).toBe("1. Buy milk\n2. Write tests");
	});

	it("should return empty message when no items", () => {
		const todoList = new TodoList();
		const formatted = todoList.format();
		expect(formatted).toBe("No todos yet.");
	});

	it("should maintain separate lists for different instances", () => {
		const list1 = new TodoList();
		const list2 = new TodoList();

		list1.add("Task 1");
		list2.add("Task 2");

		expect(list1.list()).toEqual(["Task 1"]);
		expect(list2.list()).toEqual(["Task 2"]);
	});
});
