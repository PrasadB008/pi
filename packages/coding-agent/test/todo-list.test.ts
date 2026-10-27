import { describe, it, expect, beforeEach } from "vitest";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	let todoList: TodoList;

	beforeEach(() => {
		todoList = new TodoList();
	});

	it("should add a todo item", () => {
		todoList.add("Buy milk");
		expect(todoList.getAll()).toEqual(["Buy milk"]);
	});

	it("should add multiple todo items", () => {
		todoList.add("Buy milk");
		todoList.add("Write code");
		todoList.add("Review PR");
		expect(todoList.getAll()).toEqual(["Buy milk", "Write code", "Review PR"]);
	});

	it("should return all items", () => {
		todoList.add("Item 1");
		todoList.add("Item 2");
		const items = todoList.getAll();
		expect(items).toHaveLength(2);
		expect(items).toEqual(["Item 1", "Item 2"]);
	});

	it("should clear all items", () => {
		todoList.add("Item 1");
		todoList.add("Item 2");
		todoList.clear();
		expect(todoList.getAll()).toEqual([]);
	});

	it("should report when empty", () => {
		expect(todoList.isEmpty()).toBe(true);
		todoList.add("Item");
		expect(todoList.isEmpty()).toBe(false);
	});

	it("should format empty list", () => {
		expect(todoList.format()).toBe("No todos yet.");
	});

	it("should format items with numbers", () => {
		todoList.add("First task");
		todoList.add("Second task");
		const formatted = todoList.format();
		expect(formatted).toBe("1. First task\n2. Second task");
	});

	it("should not mutate original list when calling getAll", () => {
		todoList.add("Original");
		const items = todoList.getAll();
		items.push("Modified");
		expect(todoList.getAll()).toEqual(["Original"]);
	});
});
