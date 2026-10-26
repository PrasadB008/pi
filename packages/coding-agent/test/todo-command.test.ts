import { describe, it, expect } from "vitest";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("should start with an empty list", () => {
		const todoList = new TodoList();
		expect(todoList.getItems()).toEqual([]);
	});

	it("should add a todo item", () => {
		const todoList = new TodoList();
		todoList.add("Fix bug in parser");
		expect(todoList.getItems()).toEqual(["Fix bug in parser"]);
	});

	it("should add multiple todo items", () => {
		const todoList = new TodoList();
		todoList.add("Fix bug in parser");
		todoList.add("Write tests");
		todoList.add("Update documentation");
		expect(todoList.getItems()).toEqual([
			"Fix bug in parser",
			"Write tests",
			"Update documentation",
		]);
	});

	it("should list all items", () => {
		const todoList = new TodoList();
		todoList.add("Item 1");
		todoList.add("Item 2");
		const items = todoList.getItems();
		expect(items.length).toBe(2);
		expect(items[0]).toBe("Item 1");
		expect(items[1]).toBe("Item 2");
	});

	it("should clear all items", () => {
		const todoList = new TodoList();
		todoList.add("Item 1");
		todoList.add("Item 2");
		todoList.clear();
		expect(todoList.getItems()).toEqual([]);
	});

	it("should handle empty string additions", () => {
		const todoList = new TodoList();
		todoList.add("");
		expect(todoList.getItems()).toEqual([""]);
	});

	it("should preserve item order", () => {
		const todoList = new TodoList();
		const items = ["First", "Second", "Third", "Fourth"];
		for (const item of items) {
			todoList.add(item);
		}
		expect(todoList.getItems()).toEqual(items);
	});
});
