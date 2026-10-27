import { describe, expect, test } from "vitest";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	test("adds item to todo list", () => {
		const todoList = new TodoList();
		todoList.add("fix bug in parser");
		expect(todoList.getItems()).toEqual(["fix bug in parser"]);
	});

	test("adds multiple items to todo list", () => {
		const todoList = new TodoList();
		todoList.add("first task");
		todoList.add("second task");
		expect(todoList.getItems()).toEqual(["first task", "second task"]);
	});

	test("returns empty list when no items added", () => {
		const todoList = new TodoList();
		expect(todoList.getItems()).toEqual([]);
	});

	test("clears all items", () => {
		const todoList = new TodoList();
		todoList.add("task 1");
		todoList.add("task 2");
		todoList.clear();
		expect(todoList.getItems()).toEqual([]);
	});
});
