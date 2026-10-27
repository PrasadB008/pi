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

	it("should list items in order", () => {
		todoList.add("First");
		todoList.add("Second");
		todoList.add("Third");

		const items = todoList.list();
		expect(items).toEqual(["First", "Second", "Third"]);
	});

	it("should return a copy of the list", () => {
		todoList.add("Item 1");
		const items1 = todoList.list();
		items1.push("Item 2");

		const items2 = todoList.list();
		expect(items2).toEqual(["Item 1"]);
	});

	it("should clear all items", () => {
		todoList.add("Item 1");
		todoList.add("Item 2");

		todoList.clear();

		expect(todoList.list()).toEqual([]);
	});

	it("should report when list is empty", () => {
		expect(todoList.isEmpty()).toBe(true);

		todoList.add("Item");
		expect(todoList.isEmpty()).toBe(false);

		todoList.clear();
		expect(todoList.isEmpty()).toBe(true);
	});
});
