import { beforeEach, describe, expect, it } from "vitest";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	let todoList: TodoList;

	beforeEach(() => {
		todoList = new TodoList();
	});

	it("should add items to the list", () => {
		todoList.add("Buy milk");
		todoList.add("Write tests");
		const items = todoList.list();
		expect(items).toEqual(["Buy milk", "Write tests"]);
	});

	it("should list items", () => {
		todoList.add("Item 1");
		todoList.add("Item 2");
		const items = todoList.list();
		expect(items.length).toBe(2);
		expect(items[0]).toBe("Item 1");
		expect(items[1]).toBe("Item 2");
	});

	it("should clear all items", () => {
		todoList.add("Item 1");
		todoList.add("Item 2");
		todoList.clear();
		expect(todoList.isEmpty()).toBe(true);
		expect(todoList.list().length).toBe(0);
	});

	it("should check if list is empty", () => {
		expect(todoList.isEmpty()).toBe(true);
		todoList.add("Item");
		expect(todoList.isEmpty()).toBe(false);
		todoList.clear();
		expect(todoList.isEmpty()).toBe(true);
	});

	it("should format items with numbers", () => {
		todoList.add("First task");
		todoList.add("Second task");
		const formatted = todoList.format();
		expect(formatted).toBe("1. First task\n2. Second task");
	});

	it("should return 'No todo items.' when empty", () => {
		const formatted = todoList.format();
		expect(formatted).toBe("No todo items.");
	});
});
