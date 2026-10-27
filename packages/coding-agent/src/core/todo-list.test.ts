import { beforeEach, describe, expect, it } from "vitest";
import { TodoList } from "./todo-list.ts";

describe("TodoList", () => {
	let todoList: TodoList;

	beforeEach(() => {
		todoList = new TodoList();
	});

	it("should start with an empty list", () => {
		expect(todoList.getItems()).toEqual([]);
		expect(todoList.getCount()).toBe(0);
	});

	it("should add items to the list", () => {
		todoList.add("First task");
		expect(todoList.getItems()).toEqual(["First task"]);
		expect(todoList.getCount()).toBe(1);
	});

	it("should add multiple items", () => {
		todoList.add("First task");
		todoList.add("Second task");
		todoList.add("Third task");
		expect(todoList.getItems()).toEqual(["First task", "Second task", "Third task"]);
		expect(todoList.getCount()).toBe(3);
	});

	it("should return a copy of items, not the original array", () => {
		todoList.add("Task 1");
		const items = todoList.getItems();
		items.push("Task 2");
		expect(todoList.getCount()).toBe(1);
	});

	it("should clear all items", () => {
		todoList.add("Task 1");
		todoList.add("Task 2");
		todoList.clear();
		expect(todoList.getItems()).toEqual([]);
		expect(todoList.getCount()).toBe(0);
	});
});
