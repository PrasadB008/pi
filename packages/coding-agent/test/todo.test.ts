import { describe, it } from "vitest";
import { TodoList } from "../src/modes/interactive/todo.ts";

describe("TodoList", () => {
	it("should add a todo item", ({ expect }) => {
		const todoList = new TodoList();
		const item = todoList.add("Test todo");
		expect(item.text).toBe("Test todo");
		expect(item.id).toBe("1");
	});

	it("should list all todos", ({ expect }) => {
		const todoList = new TodoList();
		todoList.add("First todo");
		todoList.add("Second todo");
		const items = todoList.getAll();
		expect(items).toHaveLength(2);
		expect(items[0].text).toBe("First todo");
		expect(items[1].text).toBe("Second todo");
	});

	it("should format todos as a string", ({ expect }) => {
		const todoList = new TodoList();
		todoList.add("First todo");
		todoList.add("Second todo");
		const formatted = todoList.format();
		expect(formatted).toContain("1. First todo");
		expect(formatted).toContain("2. Second todo");
	});

	it("should show message when no todos", ({ expect }) => {
		const todoList = new TodoList();
		const formatted = todoList.format();
		expect(formatted).toBe("No todos yet. Use /todo <text> to add one.");
	});

	it("should clear all todos", ({ expect }) => {
		const todoList = new TodoList();
		todoList.add("First todo");
		todoList.add("Second todo");
		todoList.clear();
		expect(todoList.isEmpty()).toBe(true);
		expect(todoList.getAll()).toHaveLength(0);
	});

	it("should increment todo IDs", ({ expect }) => {
		const todoList = new TodoList();
		const item1 = todoList.add("First");
		const item2 = todoList.add("Second");
		const item3 = todoList.add("Third");
		expect(item1.id).toBe("1");
		expect(item2.id).toBe("2");
		expect(item3.id).toBe("3");
	});
});
