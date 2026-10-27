import { describe, it, expect, beforeEach } from "vitest";
import { TodoStore } from "../src/modes/interactive/todo.ts";

describe("TodoStore", () => {
	let store: TodoStore;

	beforeEach(() => {
		store = new TodoStore();
	});

	it("should add a todo item", () => {
		const item = store.add("Buy groceries");
		expect(item.text).toBe("Buy groceries");
		expect(item.id).toBe("1");
	});

	it("should list all todos", () => {
		store.add("First task");
		store.add("Second task");
		const items = store.list();
		expect(items).toHaveLength(2);
		expect(items[0].text).toBe("First task");
		expect(items[1].text).toBe("Second task");
	});

	it("should format todos as numbered list", () => {
		store.add("Task 1");
		store.add("Task 2");
		const formatted = store.format();
		expect(formatted).toBe("1. Task 1\n2. Task 2");
	});

	it("should return 'No todos yet' when empty", () => {
		const formatted = store.format();
		expect(formatted).toBe("No todos yet.");
	});

	it("should clear all todos", () => {
		store.add("Task 1");
		store.add("Task 2");
		store.clear();
		expect(store.list()).toHaveLength(0);
		expect(store.format()).toBe("No todos yet.");
	});

	it("should increment todo IDs", () => {
		const item1 = store.add("First");
		const item2 = store.add("Second");
		const item3 = store.add("Third");
		expect(item1.id).toBe("1");
		expect(item2.id).toBe("2");
		expect(item3.id).toBe("3");
	});

	it("should reset ID counter after clear", () => {
		store.add("Task 1");
		store.clear();
		const item = store.add("New task");
		expect(item.id).toBe("1");
	});
});
