import { describe, it, expect } from "vitest";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("should add items to the list", () => {
		const todoList = new TodoList();
		todoList.add("Buy milk");
		todoList.add("Write tests");

		const items = todoList.list();
		expect(items).toEqual(["Buy milk", "Write tests"]);
	});

	it("should list items in order", () => {
		const todoList = new TodoList();
		todoList.add("First");
		todoList.add("Second");
		todoList.add("Third");

		expect(todoList.list()).toEqual(["First", "Second", "Third"]);
	});

	it("should clear all items", () => {
		const todoList = new TodoList();
		todoList.add("Item 1");
		todoList.add("Item 2");

		todoList.clear();
		expect(todoList.list()).toEqual([]);
	});

	it("should report when list is empty", () => {
		const todoList = new TodoList();
		expect(todoList.isEmpty()).toBe(true);

		todoList.add("Something");
		expect(todoList.isEmpty()).toBe(false);

		todoList.clear();
		expect(todoList.isEmpty()).toBe(true);
	});

	it("should return a copy of the list", () => {
		const todoList = new TodoList();
		todoList.add("Item 1");

		const items = todoList.list();
		items.push("Item 2");

		// Original list should not be modified
		expect(todoList.list()).toEqual(["Item 1"]);
	});
});
