import { describe, it, expect, beforeEach } from "vitest";
import { TodoList } from "../src/core/todo.ts";

describe("TodoList", () => {
	let todoList: TodoList;

	beforeEach(() => {
		todoList = new TodoList();
	});

	it("should add a todo item", () => {
		todoList.add("Buy milk");
		const items = todoList.list();
		expect(items).toEqual(["Buy milk"]);
	});

	it("should list multiple todo items in order", () => {
		todoList.add("Buy milk");
		todoList.add("Walk dog");
		todoList.add("Write code");
		const items = todoList.list();
		expect(items).toEqual(["Buy milk", "Walk dog", "Write code"]);
	});

	it("should return an empty list initially", () => {
		const items = todoList.list();
		expect(items).toEqual([]);
	});

	it("should clear all todo items", () => {
		todoList.add("Buy milk");
		todoList.add("Walk dog");
		todoList.clear();
		const items = todoList.list();
		expect(items).toEqual([]);
	});

	it("should return a copy of the list, not the original", () => {
		todoList.add("Buy milk");
		const items1 = todoList.list();
		items1.push("Hacked!");
		const items2 = todoList.list();
		expect(items2).toEqual(["Buy milk"]);
	});
});
