import { describe, expect, it } from "vitest";
import { TodoList } from "../src/utils/todo-list.ts";

describe("TodoList", () => {
	it("starts with no items", () => {
		const list = new TodoList();
		expect(list.getItems()).toEqual([]);
	});

	it("adds a todo item", () => {
		const list = new TodoList();
		list.add("Fix bug in parser");
		expect(list.getItems()).toEqual(["Fix bug in parser"]);
	});

	it("adds multiple todo items in order", () => {
		const list = new TodoList();
		list.add("First task");
		list.add("Second task");
		list.add("Third task");
		expect(list.getItems()).toEqual(["First task", "Second task", "Third task"]);
	});

	it("formats empty list as 'No todo items'", () => {
		const list = new TodoList();
		expect(list.format()).toBe("No todo items");
	});

	it("formats single item with number", () => {
		const list = new TodoList();
		list.add("Buy milk");
		expect(list.format()).toBe("1. Buy milk");
	});

	it("formats multiple items with numbers", () => {
		const list = new TodoList();
		list.add("First task");
		list.add("Second task");
		list.add("Third task");
		expect(list.format()).toBe("1. First task\n2. Second task\n3. Third task");
	});

	it("clears all items", () => {
		const list = new TodoList();
		list.add("Task 1");
		list.add("Task 2");
		list.clear();
		expect(list.getItems()).toEqual([]);
		expect(list.format()).toBe("No todo items");
	});
});
