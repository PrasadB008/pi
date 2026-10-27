import { describe, it, expect } from "vitest";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("should add a todo item", () => {
		const list = new TodoList();
		const item = list.add("Test todo");

		expect(item.text).toBe("Test todo");
		expect(item.id).toBe("0");
		expect(item.createdAt).toBeGreaterThan(0);
	});

	it("should list all todo items in order", () => {
		const list = new TodoList();
		list.add("First");
		list.add("Second");
		list.add("Third");

		const items = list.getAll();
		expect(items).toHaveLength(3);
		expect(items[0].text).toBe("First");
		expect(items[1].text).toBe("Second");
		expect(items[2].text).toBe("Third");
	});

	it("should remove a todo item", () => {
		const list = new TodoList();
		const item1 = list.add("First");
		const item2 = list.add("Second");

		expect(list.remove(item1.id)).toBe(true);
		expect(list.getAll()).toHaveLength(1);
		expect(list.getAll()[0].text).toBe("Second");
	});

	it("should return false when removing non-existent item", () => {
		const list = new TodoList();
		expect(list.remove("nonexistent")).toBe(false);
	});

	it("should clear all items", () => {
		const list = new TodoList();
		list.add("First");
		list.add("Second");

		list.clear();
		expect(list.isEmpty()).toBe(true);
		expect(list.size()).toBe(0);
	});

	it("should report correct size", () => {
		const list = new TodoList();
		expect(list.size()).toBe(0);

		list.add("First");
		expect(list.size()).toBe(1);

		list.add("Second");
		expect(list.size()).toBe(2);

		list.clear();
		expect(list.size()).toBe(0);
	});

	it("should report isEmpty correctly", () => {
		const list = new TodoList();
		expect(list.isEmpty()).toBe(true);

		list.add("First");
		expect(list.isEmpty()).toBe(false);

		list.clear();
		expect(list.isEmpty()).toBe(true);
	});

	it("should generate unique IDs for each item", () => {
		const list = new TodoList();
		const item1 = list.add("First");
		const item2 = list.add("Second");
		const item3 = list.add("Third");

		expect(item1.id).toBe("0");
		expect(item2.id).toBe("1");
		expect(item3.id).toBe("2");
	});
});
