import { describe, it, expect } from "vitest";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("should add items to the list", () => {
		const list = new TodoList();
		list.add("First task");
		list.add("Second task");
		expect(list.getItems()).toEqual(["First task", "Second task"]);
	});

	it("should return empty list initially", () => {
		const list = new TodoList();
		expect(list.getItems()).toEqual([]);
	});

	it("should format empty list correctly", () => {
		const list = new TodoList();
		expect(list.format()).toBe("Todo list is empty.");
	});

	it("should format items with numbers", () => {
		const list = new TodoList();
		list.add("First task");
		list.add("Second task");
		expect(list.format()).toBe("1. First task\n2. Second task");
	});

	it("should clear all items", () => {
		const list = new TodoList();
		list.add("First task");
		list.add("Second task");
		list.clear();
		expect(list.getItems()).toEqual([]);
	});

	it("should handle multiple operations", () => {
		const list = new TodoList();
		list.add("Task 1");
		expect(list.getItems()).toHaveLength(1);
		list.add("Task 2");
		expect(list.getItems()).toHaveLength(2);
		list.clear();
		expect(list.getItems()).toHaveLength(0);
		list.add("Task 3");
		expect(list.getItems()).toEqual(["Task 3"]);
	});
});
